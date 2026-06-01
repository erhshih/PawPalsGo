## 1. Monorepo 與專案初始化

- [x] 1.1 建立 pnpm workspace，設定 `pnpm-workspace.yaml` 定義 `apps/*` 與 `packages/*`
- [x] 1.2 建立 `packages/shared`，設定 TypeScript 並匯出共用型別（`UserRole`、`SwipeDirection`、`MeetingStatus`、`WalletTransactionType`）
- [ ] 1.3 在 `apps/backend` 以 `@nestjs/cli` 建立 NestJS 專案，啟用 TypeScript strict mode
- [x] 1.4 在 `apps/mobile` 以 `create-expo-app`（TypeScript 範本）建立 Expo React Native 專案
- [x] 1.5 安裝 NativeWind 至 `apps/mobile`，設定 `tailwind.config.js` 與 `babel.config.js`
- [x] 1.6 建立根目錄 `.env.example`，列出所有必要環境變數（`DATABASE_URL`、`REDIS_URL`、`JWT_SECRET`、`JWT_REFRESH_SECRET`、`PORT`）
- [x] 1.7 將 `packages/shared` 加入 `apps/backend` 與 `apps/mobile` 的 workspace 依賴

## 2. 基礎設施（Docker Compose）

- [ ] 2.1 建立 `docker-compose.yml`，加入 `postgres` 服務（映像：`postgis/postgis:15-3.4`），設定 volume 掛載與健康檢查
- [ ] 2.2 在 `docker-compose.yml` 加入 `redis` 服務（映像：`redis:7-alpine`，啟用 `--appendonly yes` AOF 持久化）
- [ ] 2.3 在 `docker-compose.yml` 為後端照片儲存設定 `uploads` volume 掛載
- [ ] 2.4 執行 `docker compose up -d` 驗證兩個服務正常啟動，並確認 PostGIS 擴充可用（`SELECT PostGIS_version()`）

## 3. 資料庫 Schema（Prisma）

- [ ] 3.1 安裝 Prisma，在 `apps/backend` 設定 `prisma/schema.prisma`（PostgreSQL provider）
- [ ] 3.2 定義 `User` 模型：`id`、`email`（唯一）、`passwordHash`、`role`（enum: OWNER/LOVER）、`location`（`Unsupported("geography(Point,4326)")`）、`createdAt`
- [ ] 3.3 定義 `Pet` 模型：`id`、`ownerId`（→ User）、`name`、`breed`、`bio`、`tags`（String[]）、`birthDate`、`createdAt`
- [ ] 3.4 定義 `Photo` 模型：`id`、`petId`（→ Pet）、`url`、`kind`（closeup/owner/bw）、`sortOrder`、`createdAt`
- [ ] 3.5 定義 `Swipe` 模型：`id`、`swiperId`、`targetId`、`direction`（LIKE/PASS/SUPER_LIKE）、`createdAt`；加入 `(swiperId, targetId)` 唯一約束
- [ ] 3.6 定義 `Match` 模型：`id`、`userAId`、`userBId`、`createdAt`；加入 `(userAId, userBId)` 唯一約束（強制 `userAId < userBId`）
- [ ] 3.7 定義 `Meeting` 模型：`id`、`matchId`（→ Match）、`initiatorId`、`scheduledAt`、`status`（enum: SCHEDULED/CHECKING_IN/COMPLETED/CANCELLED_BENIGN/CANCELLED_PENALTY）、`escrow`（Int，預設 0）、`createdAt`、`updatedAt`
- [ ] 3.8 定義 `Message` 模型：`id`、`matchId`（→ Match）、`senderId`（→ User）、`text`、`createdAt`
- [ ] 3.9 定義 `Wallet` 模型：`id`、`userId`（→ User，唯一）、`balance`（Int，預設 0）
- [ ] 3.10 定義 `WalletTransaction` 模型：`id`、`userId`、`type`（enum: TOPUP/DEBIT/CREDIT/ESCROW/ESCROW_RELEASE）、`amount`、`relatedEntityId`、`createdAt`
- [ ] 3.11 撰寫初始 Migration 啟用 PostGIS 擴充（`CREATE EXTENSION IF NOT EXISTS postgis`），執行 `prisma migrate dev`
- [ ] 3.12 為 `User` 表的 `location` 欄位撰寫 Raw SQL Migration（`ALTER TABLE "User" ADD COLUMN location geography(Point,4326)`）
- [ ] 3.13 在 `prisma/seed.ts` 建立測試資料：2 位測試使用者（一位 OWNER、一位 LOVER）與 5 隻測試寵物

## 4. 後端：Auth 模組

- [ ] 4.1 建立 `AuthModule`（`nest g module auth`），安裝 `@nestjs/passport`、`passport-jwt`、`bcrypt`、`@nestjs/jwt`
- [ ] 4.2 實作 `POST /auth/register`：驗證請求體（email、密碼 ≥ 8 字元、role），以 bcrypt（cost 10）雜湊密碼，在同一 Prisma transaction 中建立 User 與 Wallet 記錄
- [ ] 4.3 實作 `POST /auth/login`：驗證 email/密碼，簽發存取 token（15 分鐘）與刷新 token（7 天），以 HttpOnly Cookie 回傳刷新 token
- [ ] 4.4 實作 `JwtAuthGuard`（使用 `@nestjs/passport` JWT strategy），將 `req.user = { userId, role }` 掛載至請求物件
- [ ] 4.5 實作 `RolesGuard` 與 `@Roles()` 裝飾器；從 `req.user.role` 讀取角色，不符時回傳 HTTP 403
- [ ] 4.6 實作 `POST /auth/refresh`：讀取 `refreshToken` Cookie，驗證 Redis 中的 hash，發行新 token 對，撤銷舊刷新 token
- [ ] 4.7 登入時將刷新 token hash 儲存至 Redis（`SET refresh:{userId} {hash} EX 604800`），刷新或登出時刪除
- [ ] 4.8 實作 `POST /auth/logout`：清除刷新 token Cookie 並刪除 Redis key
- [ ] 4.9 撰寫端對端測試：成功註冊、重複 email（409）、LOVER 被 `POST /pets` 拒絕（403）、token 刷新流程

## 5. 後端：寵物檔案模組

- [ ] 5.1 建立 `PetsModule`，設定全域 `JwtAuthGuard`，並在 `POST /pets` 加上 `@Roles('OWNER')`
- [ ] 5.2 實作 `POST /pets`：驗證請求體（name、breed、bio ≤ 140 字元、tags ≤ 5 個），建立 Pet 記錄並關聯至 `req.user.userId`
- [ ] 5.3 實作 `PATCH /pets/:petId`：確認請求者擁有該寵物（否則回傳 403），執行部分更新
- [ ] 5.4 設定 `multer` 儲存（`POST /pets/:petId/photos`）：僅接受 JPEG/PNG、最大 10 MB，儲存至 `uploads/pets/{petId}/{uuid}.ext`
- [ ] 5.5 實作 `POST /pets/:petId/photos`：強制最多 5 張照片（超過回傳 422），建立 `Photo` 記錄並存入 URL
- [ ] 5.6 實作 `DELETE /pets/:petId/photos/:photoId`：驗證所有權，刪除 `Photo` 記錄並從磁碟移除檔案
- [ ] 5.7 實作 `GET /pets/:petId`：回傳寵物資料，照片依 `sortOrder` 升序排列
- [ ] 5.8 以 `ServeStaticModule` 提供 `uploads/` 目錄的靜態檔案服務

## 6. 後端：地理定位與探索模組

- [ ] 6.1 建立 `DiscoverModule`；安裝 `ioredis`，建立 `RedisModule` 作為共用 Provider
- [ ] 6.2 實作 `PATCH /users/me/location`：驗證 `{ lat, lng }` 座標範圍，以 `prisma.$executeRaw` 搭配 `ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography` 更新 User 的 `location` 欄位
- [ ] 6.3 實作 `GET /discover` Handler，接受 `radius`（預設 5，最大 50）、`page`、`limit` 查詢參數
- [ ] 6.4 實作 `DiscoverService.findNearby()`，以 `prisma.$queryRaw` 執行含 `ST_DWithin` 與 `ST_Distance` 的空間查詢；將原始結果映射為型別化 `DiscoverResultDto[]`（含 `distanceM` 欄位）
- [ ] 6.5 依請求者角色分流查詢邏輯：LOVER → 回傳附近 Pet（join 飼主位置）；OWNER → 回傳附近 LOVER 使用者
- [ ] 6.6 當請求者 `location` 為 null 時，回傳 HTTP 422（`LOCATION_NOT_SET`）
- [ ] 6.7 撰寫整合測試，驗證 `GET /discover` 透過 PostGIS 正確回傳半徑內的寵物

## 7. 後端：滑卡與配對模組

- [ ] 7.1 建立 `SwipeModule` 與 `MatchModule`
- [ ] 7.2 實作 `POST /swipes`：驗證 `{ targetUserId, direction }`；LIKE/SUPER_LIKE 時執行 Redis `SADD user:{userId}:likes {targetUserId}`
- [ ] 7.3 Redis 寫入後執行 `SISMEMBER user:{targetUserId}:likes {userId}`；若雙向互喜，在 PostgreSQL 建立 `Match` 記錄（`userAId = min(A,B)`，`userBId = max(A,B)`），回傳 `{ matched: true, matchId }`
- [ ] 7.4 處理 `Match` 唯一約束衝突（競爭條件）：捕捉例外並回傳既有配對記錄
- [ ] 7.5 實作 `GET /matches`：回傳當前使用者的所有配對，含對方資料與 `unreadCount`
- [ ] 7.6 實作 `GET /matches/:matchId`：回傳配對詳情與最新 20 則訊息

## 8. 後端：錢包模組

- [ ] 8.1 建立 `WalletModule`，`WalletService` 提供以 Prisma transaction 封裝的原子性扣款/入帳/托管方法
- [ ] 8.2 實作 `GET /wallet`：回傳 `{ balance, currency: "肉乾" }`
- [ ] 8.3 實作 `POST /wallet/topup`：驗證 `packageId` 是否在伺服器端套餐清單中，增加餘額並寫入 `WalletTransaction` 記錄
- [ ] 8.4 實作 `POST /swipes/:targetUserId/treat`：在同一 Prisma transaction 中，從發送者扣 1 肉乾、入帳 1 肉乾至接收者，並記錄兩筆交易
- [ ] 8.5 新增 `WalletService.debitEscrow(userId, amount, meetingId)`：扣除餘額並寫入 ESCROW 交易紀錄；餘額不足時拋出例外
- [ ] 8.6 新增 `WalletService.releaseEscrow(meetingId, recipientId)`：入帳至接收者並寫入 ESCROW_RELEASE 交易紀錄

## 9. 後端：Go! 約會托管模組

- [ ] 9.1 建立 `MeetingModule`，包含 `MeetingService` 與 `MeetingController`
- [ ] 9.2 實作 `POST /meetings`：驗證 `{ matchId, scheduledAt }`（需距今 ≥ 30 分鐘），確認請求者為配對成員，呼叫 `WalletService.debitEscrow`，建立狀態為 `SCHEDULED` 的 Meeting
- [ ] 9.3 實作 `DELETE /meetings/:id` 取消邏輯：計算距 `scheduledAt` 的時間差；> 2 小時 → `CANCELLED_BENIGN`（退款給發起者）；≤ 2 小時 → `CANCELLED_PENALTY`（轉帳給對方）；整體包裹在 Prisma transaction 中
- [ ] 9.4 實作 `GET /meetings/:id/qr`（限非發起者）：確認請求者非發起者且 `now ≥ scheduledAt`，生成 UUID token，`SETEX meeting:{id}:totp {token} 30`，回傳 `{ token, expiresIn: 30 }`
- [ ] 9.5 實作 `POST /meetings/:id/verify`（限發起者）：從 Redis 取得 token 並與提交值進行固定時間比對；驗證成功則呼叫 `WalletService.releaseEscrow` 並將狀態設為 `COMPLETED`；過期或錯誤回傳 422
- [ ] 9.6 每次狀態轉換時，透過 Socket.IO 向配對房間發送 `meeting:updated` 事件

## 10. 後端：聊天 WebSocket Gateway

- [ ] 10.1 安裝 `@nestjs/websockets`、`@nestjs/platform-socket.io`、`socket.io`；建立 `ChatGateway`（`@WebSocketGateway({ cors: true })`）
- [ ] 10.2 驗證 WebSocket 連線：從 handshake auth header 取出 JWT，驗證後將 `client.data.user` 掛載至連線
- [ ] 10.3 處理 `chat:join` 事件：驗證使用者為配對成員，加入房間 `room:match-{matchId}`
- [ ] 10.4 處理 `chat:send` 事件：持久化 `Message` 記錄，向房間廣播 `chat:message`，以 Redis 遞增未讀計數（`INCR unread:{matchId}:{recipientId}`）
- [ ] 10.5 實作 `GET /matches/:matchId/messages`，支援 cursor 分頁（`?before=<messageId>&limit=20`，預設 20）
- [ ] 10.6 實作 `POST /matches/:matchId/read`：重置 Redis 未讀計數（`DEL unread:{matchId}:{userId}`）
- [ ] 10.7 配對建立時（來自 `SwipeService`）向雙方已連線的 socket 發送 `match:new` 事件，payload 包含對方檔案
- [ ] 10.8 Meeting 建立時，向配對房間廣播系統訊息：`"已發起 Go! 約會 — {scheduledAt}，5 肉乾已托管。"`

## 11. 前端：App Shell 與導覽

- [x] 11.1 安裝 `expo-router`，設定以檔案為基礎的路由，建立 `(auth)` 與 `(app)` 路由群組
- [x] 11.2 在根 layout 實作 Auth 守門：啟動時從 `expo-secure-store` 讀取存取 token；不存在或無效時導向 `/(auth)/welcome`
- [x] 11.3 App 啟動時實作靜默 token 刷新（存取 token 過期時呼叫 `POST /auth/refresh`；失敗則導向登入頁）
- [x] 11.4 建立 `(app)/(tabs)/_layout.tsx`，使用 `expo-router` Tabs 實作底部 TabBar（探索／訊息／身份）
- [x] 11.5 套用 Threads 視覺系統：建立 `theme.ts`（zinc-950/900/800/500 常數），設定 NativeWind Dark Mode
- [x] 11.6 建立 `ApiClient` 單例（axios instance）：設定 baseURL、JWT 攔截器（附加 `Authorization: Bearer`）、401 → 刷新 → 重試邏輯
- [x] 11.7 建立 `SocketClient` 單例（socket.io-client）：認證後連線，登出後斷線
- [x] 11.8 實作全域錯誤 Toast 元件：訂閱 `ToastStore`（zustand），3 秒後自動消失，渲染於 TabBar 上方
- [x] 11.9 安裝並設定 `lucide-react-native` 與正確的 peer dependencies

## 12. 前端：Onboarding 與認證畫面

- [x] 12.1 建立 `/(auth)/welcome.tsx`：App 標誌字、OWNER 白色卡片、LOVER zinc-900 卡片，按壓時箭頭圖標旋轉 -45 度，點擊後帶 role 參數導向註冊
- [x] 12.2 建立 `/(auth)/register.tsx`：Email、密碼（≥ 8 字元，隱藏）、確認密碼欄位，含行內驗證；呼叫 `POST /auth/register`，成功後儲存 JWT 並導向照片 Onboarding
- [x] 12.3 建立 `/(auth)/login.tsx`：Email + 密碼欄位，`INVALID_CREDENTIALS` 時顯示錯誤橫幅，登入成功後導向主應用
- [x] 12.4 建立 `/(auth)/onboarding.tsx`：照片分類格（OWNER: 1 類；LOVER: 2 類）；`AddTile` 觸發 `expo-image-picker`；`PhotoTile` 含主圖徽章與移除按鈕
- [x] 12.5 實作 Onboarding CTA 守門：未達各類最低張數時停用按鈕並顯示「還差 N 張必填照片」
- [x] 12.6 Onboarding 完成時，以 `POST /pets/{id}/photos` multipart 上傳所有照片，完成後導向 `(app)/(tabs)/swipe`
- [x] 12.7 在 Welcome 畫面加入「已有帳號？登入」連結，導向登入頁

## 13. 前端：滑卡探索畫面

- [x] 13.1 建立 `/(app)/(tabs)/swipe.tsx`；掛載時從 `GET /discover` 取得第一頁資料，存入本地佇列（zustand 或 useState）
- [x] 13.2 實作卡片堆疊：頂部卡片全尺寸，第二張以 `scale(0.96)` 與 `-8px` translateY 顯示（使用 `react-native-reanimated`）
- [x] 13.3 實作相簿點擊切換：將卡片分為左右兩半；左半點擊遞減照片索引（含回繞），右半點擊遞增
- [x] 13.4 在卡片頂部渲染照片進度條（分段、2px 高），當前段落純白，已看段落 60% 透明度
- [x] 13.5 實作向左滑動動畫（translate -140%、rotate -22deg、opacity 0，320ms），由 Pass 按鈕觸發
- [x] 13.6 實作向右滑動動畫（translate +140%、rotate +22deg、opacity 0，320ms），由 Like 按鈕觸發
- [x] 13.7 實作向上滑動動畫（translate 0 -120%、scale 0.95、opacity 0，320ms），由 Super Like 按鈕觸發
- [x] 13.8 動畫結束後：呼叫 `POST /swipes`，推進佇列，重置照片索引；佇列 < 3 張時自動取下一頁
- [x] 13.9 每次滑動後短暫顯示動作提示（「LIKE」／「PASS」／「SUPER」，等寬字體，毛玻璃背景，600ms）
- [x] 13.10 卡片右下角投餵肉乾按鈕，點擊開啟底部 Sheet 顯示投餵詳情與確認／取消
- [x] 13.11 確認投餵：呼叫 `POST /swipes/{targetUserId}/treat`，顯示「TREAT SENT」提示；餘額不足時顯示錢包錯誤
- [x] 13.12 在卡片左上角顯示照片類型標籤（毛孩特寫／主僕街拍合照／高冷黑白照），使用毛玻璃深色背景
- [x] 13.13 佇列耗盡時渲染「附近暫時沒有新朋友」空狀態卡片
- [x] 13.14 監聽 `match:new` Socket.IO 事件；顯示全螢幕配對彈窗，含對方資料與「開始聊天」CTA

## 14. 前端：聊天與 Go! 約會畫面

- [x] 14.1 建立 `/(app)/(tabs)/chat.tsx`：配對列表，顯示頭像、最後一則訊息預覽與未讀徽章；掛載時呼叫 `GET /matches`
- [x] 14.2 建立 `/(app)/chat/[matchId].tsx`：可滾動訊息列表（FlatList 倒置），底部文字輸入列與發送按鈕
- [x] 14.3 畫面掛載時連接 Socket.IO：發送 `chat:join`，監聽 `chat:message` 並追加至本地訊息列表
- [x] 14.4 發送訊息：發出 `chat:send` 並樂觀追加至本地列表；畫面開啟時呼叫 `POST /matches/:matchId/read`
- [x] 14.5 系統訊息（from: "sys"）以置中、zinc-500、斜體樣式渲染
- [x] 14.6 在輸入工具列加入「發起 Go! 約會」按鈕，開啟預約底部 Sheet
- [x] 14.7 預約 Sheet：日期時間選擇器（未來 7 天）、托管說明（「發起約會將扣除您 5 塊肉乾 🥩 作為誠意金…」）、確認按鈕呼叫 `POST /meetings`
- [x] 14.8 當存在 `SCHEDULED` 狀態的 Meeting 時，在訊息列表上方顯示進行中約會狀態卡，含預約時間與取消按鈕
- [x] 14.9 取消約會流程：提供兩個選項（「2 小時前取消」／「2 小時內取消」模擬）→ 呼叫 `DELETE /meetings/:id` → 顯示退款或懲罰結果彈窗
- [x] 14.10 當 Meeting 狀態為 `SCHEDULED` 且當前時間 ≥ `scheduledAt` 時，切換至簽到卡片
- [x] 14.11 非發起者簽到視圖：呼叫 `GET /meetings/:id/qr`，以 `react-native-qrcode-svg` 渲染 QR Code，顯示 30 秒倒數進度條，token 過期時自動更新
- [x] 14.12 發起者簽到視圖：「開啟相機掃描簽到」按鈕 → 相機對焦框（mock 或 `expo-camera`），掃碼後呼叫 `POST /meetings/:id/verify`
- [x] 14.13 驗證成功後顯示成功彈窗：「驗證成功！託管的 5 塊肉乾已安全撥入對方的錢包 🐾」
- [x] 14.14 監聽 `meeting:updated` Socket.IO 事件，即時更新約會狀態卡

## 15. 前端：身份與錢包畫面

- [x] 15.1 建立 `/(app)/(tabs)/profile.tsx`（身份面板）：顯示頭像、角色徽章、統計數字（配對／訊息／肉乾）、設定列表
- [x] 15.2 從 `GET /wallet` 取得餘額並顯示於肉乾統計格
- [x] 15.3 點擊肉乾統計格或「儲值肉乾」按鈕，開啟儲值底部 Sheet（三種套餐選項）
- [x] 15.4 儲值 Sheet：顯示套餐卡片（30／100／300 肉乾及對應價格），確認後呼叫 `POST /wallet/topup` 並更新餘額
- [x] 15.5 「切換 ↺」按鈕：呼叫 `POST /auth/logout`，清除 Secure Storage，導向 Welcome 畫面
- [x] 15.6 加入「編輯毛孩檔案」、「通知偏好」、「封鎖名單」、「關於 PawPals Go」的佔位按鈕列（導向空白頁）

## 16. 整合測試與收尾

- [ ] 16.1 在 iOS 模擬器與 Android 模擬器上驗證 GPS 權限請求流程（`expo-location`）
- [ ] 16.2 在 `packages/shared` 實作 haversine 距離計算函式，並套用至前端 GPS 防抖 Hook
- [ ] 16.3 端對端測試完整配對流程：註冊兩位使用者 → 互相右滑 → 收到 `match:new` → 開啟聊天
- [ ] 16.4 端對端測試 Go! 托管流程：建立約會 → 模擬良性取消（確認退款）；建立約會 → 模擬懲罰取消（確認轉帳）
- [ ] 16.5 端對端測試 QR 簽到流程：非發起者生成 QR → 發起者驗證 → 確認狀態變為 COMPLETED 且錢包已入帳
- [ ] 16.6 在根目錄新增 `README.md`，包含完整設定說明（`docker compose up`、`prisma migrate dev`、後端啟動、Expo 啟動）
- [ ] 16.7 確認 `uploads/` 靜態檔案可從 React Native 的 iOS 模擬器與實機存取（確認網路 URL 正確）
