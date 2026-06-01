## Context

PawPals Go 的 React 純前端原型（`reference/PawPals Go/`）已完成 UI 視覺設計驗證。本設計文件說明如何將其升級為可部署的全端產品：前端改用 React Native + NativeWind、後端採 NestJS + PostgreSQL(PostGIS) + Redis，並實作地理空間配對、Redis 即時互配、Go! 約會托管履約等核心業務邏輯。

**當前限制**：
- 原型全部資料為 `window.PawPals` 靜態 mock，無任何持久化
- 無身份驗證機制，無 OWNER/LOVER 角色守衛
- 所有「肉乾」扣款、QR Code 簽到均為前端模擬，不具任何真實托管能力

---

## Goals / Non-Goals

**Goals:**
- 建立 pnpm monorepo，包含 `apps/backend`（NestJS）、`apps/mobile`（Expo React Native）、`packages/shared`（型別共用）
- 實作 JWT 雙 Token（access + refresh）認證，及 `OWNER`/`LOVER` 角色守衛
- 以 PostGIS `ST_DWithin` 實作地理空間鄰近搜尋；前端 GPS 防抖（< 500m 不呼叫後端）
- 以 Redis Set 實現毫秒級互配偵測（SISMEMBER），配對成功才落地 PostgreSQL
- 實作 Go! 約會托管系統：肉乾（虛擬貨幣）扣押、取消懲罰、TOTP 時效性 QR Code 簽到
- WebSocket（Socket.IO）實現即時聊天與 Match 通知
- Prisma + Docker Compose 提供可重現的開發環境

**Non-Goals:**
- 真實金流（IAP 儲值為 mock）
- 推播通知（FCM/APNs）
- 圖片 CDN / 壓縮（MVP 直接存 DB blob 或本地 static 服務）
- 管理後台
- 生產環境 Kubernetes / CI/CD 部署

---

## Decisions

### D1：Monorepo 結構 — pnpm workspaces

**選擇**：pnpm monorepo（`apps/backend`、`apps/mobile`、`packages/shared`）

**理由**：前後端共用 TypeScript 型別（如 `UserRole`、`SwipeResult`、`MeetingStatus`），monorepo 允許直接 `import @pawpals/shared` 而無需發佈 npm。相比 Turborepo，pnpm workspaces 對 Expo 相容性更好，設定較輕量。

**替代考量**：分開 repo → 型別需手動同步，易漂移；Nx → 功能過重，學習成本高。

---

### D2：後端框架 — NestJS（模組化 DI）

**選擇**：NestJS，各功能封裝為獨立模組（AuthModule、PetsModule、DiscoverModule、SwipeModule、ChatModule、MeetingModule、WalletModule）

**理由**：spec 明確要求 NestJS；其 DI 容器、Guard/Interceptor/Pipe 機制天然對應 `RolesGuard`、`JwtAuthGuard` 需求，且與 Prisma、Socket.IO 整合生態成熟。

---

### D3：認證策略 — JWT 雙 Token（Access + Refresh）

**選擇**：
- **Access Token**：15 分鐘有效期，帶 `sub`（userId）、`role`（OWNER/LOVER）
- **Refresh Token**：7 天有效期，存 HttpOnly Cookie；後端以 Redis 儲存已發出的 refresh token hash（可主動撤銷）

**理由**：純 Access Token 過期時間若太短會頻繁登出，若太長則洩漏風險大。雙 Token 方案兼顧安全與體驗。`role` 內嵌 JWT 使 `RolesGuard` 不需額外 DB 查詢。

**替代考量**：Session-based → 不利水平擴展；單一長效 Token → 無法快速撤銷。

---

### D4：地理空間查詢 — PostGIS + `prisma.$queryRaw`

**選擇**：PostgreSQL 15 + PostGIS 3；User 與 Pet 表各存 `geography(Point, 4326)` 欄位；`GET /discover` 使用 `prisma.$queryRaw` 執行 `ST_DWithin`

**理由**：spec REQ-007 明確要求此組合。Prisma 原生不支援 PostGIS 型別，因此地理查詢必須用 `$queryRaw`，其餘 CRUD 仍走 Prisma Client。`geography` 型別（而非 `geometry`）直接支援公尺單位計算，無需手動轉換。

```sql
-- 範例查詢（後端 DiscoverService）
SELECT p.*, ST_Distance(u.location, $1::geography) AS distance_m
FROM "Pet" p
JOIN "User" u ON u.id = p."ownerId"
WHERE ST_DWithin(u.location, $1::geography, $2 * 1000)  -- radius in meters
  AND p."ownerId" != $3
ORDER BY distance_m
LIMIT $4 OFFSET $5;
```

---

### D5：即時互配偵測 — Redis Set

**選擇**：`POST /swipes` → 寫 `SADD user:{userId}:likes {targetId}` → `SISMEMBER user:{targetId}:likes {userId}` 偵測互相喜歡

**理由**：spec REQ-010/011 明確要求 Redis Set；`SISMEMBER` 為 O(1)，大量並發下延遲穩定在 < 1ms，避免對 PostgreSQL `Swipe` 表的高頻讀寫。配對確認後才非同步寫入 PostgreSQL `Match` 表。

**Redis Key 設計**：
```
user:{userId}:likes          → SET of targetUserIds (SADD / SISMEMBER)
refresh:{userId}             → refresh token hash (SETEX 7d)
meeting:{meetingId}:totp     → 當次 QR token (SETEX 30s，TOTP 時效模擬)
```

---

### D6：即時通訊 — Socket.IO over WebSocket

**選擇**：NestJS `@nestjs/websockets` + Socket.IO；每個 Match 建立獨立 room（`room:match-{matchId}`）

**理由**：Chat 訊息與 Match 通知均需即時推送。Socket.IO 提供自動重連、fallback 到 long-polling（對 Expo 環境友好），且 NestJS Gateway 模式與現有模組系統整合無縫。

**替代考量**：REST polling（每 2 秒）→ 延遲高、伺服器負載大，體驗差；純 WebSocket（ws）→ 需自行處理重連與 room 管理。

---

### D7：Go! 約會托管 — 後端狀態機 + TOTP QR Code

**選擇**：`Meeting` 表含狀態欄位（`SCHEDULED → CHECKING_IN → COMPLETED / CANCELLED`）；肉乾扣押為 `Wallet` 表的 `escrow` 欄位；取消懲罰由後端依時間差判斷；QR Code token 存 Redis（30 秒 TTL 模擬 TOTP）

**狀態轉換**：
```
SCHEDULED
  ├─ 發起者掃碼成功 → CHECKING_IN
  │     └─ 非發起者出示 QR 通過 → COMPLETED（托管肉乾轉入非發起者）
  └─ 任一方取消：
        距約定時間 > 2h → CANCELLED_BENIGN（全額退還）
        距約定時間 ≤ 2h → CANCELLED_PENALTY（肉乾沒收並補償對方）
```

**QR Code 生成**：非發起者呼叫 `GET /meetings/{id}/qr` → 後端生成 UUID token，`SETEX meeting:{id}:totp {token} 30`，回傳 token（前端轉 QR 圖）；發起者掃碼後呼叫 `POST /meetings/{id}/verify` 帶 token → 後端 `GET` Redis 驗證。

---

### D8：前端相片上傳 — Expo ImagePicker + FormData multipart

**選擇**：`expo-image-picker` 選擇照片 → FormData multipart POST 到 `POST /pets/{id}/photos` → 後端暫存本地 static 目錄（`multer`）

**理由**：MVP 不引入 S3 等外部 CDN。後端以 `multer` 接收、儲存於 `uploads/` 目錄，並將 URL 存入 `Photo` 表。升級 CDN 時只需替換 storage adapter。

---

### D9：前端 GPS 防抖 — haversine 公式 + useRef

**選擇**：前端以 `expo-location` watchPositionAsync 監聽 GPS；每次收到新座標時，用 haversine 公式計算與上次上報座標的距離；> 500m 才呼叫 `PATCH /users/me/location`

```typescript
// 偽碼
const lastReported = useRef<Coords | null>(null);
onLocationUpdate(newCoords => {
  if (!lastReported.current || haversine(lastReported.current, newCoords) > 500) {
    api.updateLocation(newCoords);
    lastReported.current = newCoords;
  }
});
```

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Redis 重啟導致 LIKE 資料遺失（尚未落地 PostgreSQL） | 設定 Redis AOF 持久化；或定期 background job 將 Redis Set dump 至 PG `Swipe` 表 |
| PostGIS `$queryRaw` 難以 type-safe | 定義 raw result DTO interface；撰寫 integration test 驗證欄位存在 |
| TOTP QR Code 30s TTL 若網路慢則過期 | 客戶端顯示倒數條；可重新請求新 token |
| Expo WebSocket 在背景被 OS 斷線 | App 進入前景時重連；Socket.IO 自動重連機制 |
| `OWNER` role 一經選擇不可更改（spec REQ-002） | 前端隱藏切換按鈕；後端 Guard 強制；需在 UX 上清楚告知使用者 |
| 圖片存本地 `uploads/` 不具 HA | MVP 接受；文件說明未來換 S3/R2 路徑 |

---

## Migration Plan

1. `docker compose up -d` 啟動 PostgreSQL（PostGIS）+ Redis
2. `pnpm --filter backend prisma migrate dev` 跑 schema migration（含 PostGIS extension 啟用）
3. `pnpm --filter backend start:dev` 啟動後端（port 3000）
4. `pnpm --filter mobile start` 啟動 Expo dev server
5. 使用 Expo Go 或模擬器連接前端

**Rollback**：MVP 無生產資料，直接 `docker compose down -v` 清除即可重建。

---

## Open Questions

- **OQ-1**：照片驗證（reference.md 提到「人工 + AI 真人驗證」）— MVP 是否跳過，僅保留 UI badge？
- **OQ-2**：`Super Like` 在後端的權重/費用設計？（原型僅有 UI 動畫，無業務邏輯差異）
- **OQ-3**：肉乾儲值是否需要串接真實 IAP（App Store / Google Play）？MVP 使用 mock？
- **OQ-4**：Chat 訊息是否需要歷史持久化分頁（cursor pagination）？
