## Why

PawPals Go 是一款「雙軌制毛孩社交交友 App」，以毛孩為媒介媒合有寵物的飼主（OWNER）與沒寵物的貓狗奴（LOVER）。目前僅有純前端 React 原型（`reference/PawPals Go/`），需建立完整全端專案：React Native 前端 + NestJS 後端 + PostgreSQL（PostGIS）+ Redis，並落實地理空間配對、即時匹配、Go! 約會托管履約等核心商業邏輯。

## What Changes

**後端 (NestJS)**
- 建立 NestJS 專案骨架（TypeScript、模組化結構）
- 實作 Auth 模組：Email/密碼註冊登入、bcrypt 加密、JWT 簽發與驗證
- 實作 RolesGuard：OWNER/LOVER 身份守衛，`POST /pets` 限 OWNER 存取
- 實作 Pets 模組：OWNER 建立寵物檔案（含多張照片）
- 實作 Discover 模組：`GET /discover` 以 PostGIS `ST_DWithin` 查詢附近寵物/使用者
- 實作 Swipe 模組：`POST /swipes` 寫入 Redis Set，`SISMEMBER` 即時偵測互相喜歡並建立 Match
- 實作 Match 模組：Match 紀錄 PostgreSQL 讀寫
- 實作 Go! 約會托管系統：預約建立、肉乾扣押、取消懲罰分流（2 小時前/內）、TOTP QR Code 雙向簽到
- 實作 Chat 模組：聊天室訊息（WebSocket 或 REST polling）
- 實作 TopUp 模組：肉乾餘額管理

**資料庫**
- Prisma schema：User、Pet、Photo、Swipe、Match、Meeting、Message、Wallet 表
- PostGIS 擴充：User/Pet 地理座標欄位（`geography(Point, 4326)`）
- Migration 腳本

**基礎設施**
- `docker-compose.yml`：PostgreSQL + PostGIS、Redis 服務
- `.env` 範本

**前端 (React Native + NativeWind)**
- 將 `reference/PawPals Go/` 原型元件移植為 React Native + TypeScript + NativeWind
- 保留 Threads 美學（全黑 Dark Mode、細線條、大留白）
- 畫面：Welcome、Onboarding（照片上傳）、SwipeDeck、Chat + Go! 系統、MePanel
- GPS 定位 + 500 公尺防抖邏輯（距離移動 < 500m 不呼叫後端）
- Match 成功即時彈窗

## Capabilities

### New Capabilities

- `auth`: 使用者註冊/登入（Email+密碼）、bcrypt、JWT、身份選擇（OWNER/LOVER）、RolesGuard
- `geolocation-discovery`: PostGIS `ST_DWithin` 附近搜尋、前端 GPS 防抖（500m 門檻）、`GET /discover`
- `swipe-match`: Redis Set 記錄 LIKE、`SISMEMBER` 即時互配偵測、Match 寫入 PostgreSQL、即時 Match 彈窗
- `pet-profile`: OWNER 建立/編輯寵物檔案（名稱、品種、照片、位置、標籤）
- `go-escrow`: 約會預約、肉乾（虛擬貨幣）扣押托管、取消懲罰分流、TOTP QR Code 雙向簽到（PostGIS 空間解鎖）
- `chat`: 聊天室訊息收發（發起 Go! 約會入口整合）
- `wallet`: 肉乾餘額管理、儲值（IAP 模擬）、扣款/退款
- `app-shell`: React Native 手機框架、底部 TabBar（探索/訊息/身份）、Threads 視覺風格系統
- `swipe-deck-ui`: 滑卡介面（相簿切換、Pass/Like/Super Like 動畫）、投餵肉乾 IAP 彈窗
- `onboarding-ui`: 身份選擇頁、照片上傳 onboarding 流程

### Modified Capabilities

（無既有 specs，全為新建）

## Impact

- **新增專案目錄結構**：`apps/backend`（NestJS）、`apps/mobile`（React Native）、`packages/shared`（型別共用）
- **外部依賴**：Docker Compose、PostgreSQL 15 + PostGIS 3、Redis 7、Expo SDK（React Native）
- **CDN 原型**（`reference/PawPals Go/`）：僅作為 UI 視覺參考，不直接部署
- **環境需求**：Node.js 20+、Docker Desktop、Expo CLI
