# PawPals Go — Bug & TODO 清單

> 最後更新：2026-05-29

---

## 🔴 Critical（功能壞掉或安全問題）

### 1. Socket 事件名稱不吻合（match:new）
- **位置**：`apps/backend/src/chat/chat.gateway.ts` emit `match:new:${userId}`
- **問題**：mobile swipe 頁面 socket listener 監聽的是 `match:new`（無 userId），名稱對不上，配對成功後 modal 不會出現
- **修法**：統一改成同一個格式

### 2. Chat 訊息 API 沒有授權驗證
- **位置**：`apps/backend/src/chat/chat.controller.ts` `GET :matchId/messages`
- **問題**：任何登入用戶只要知道 matchId 就可以讀別人的聊天記錄
- **修法**：驗證 `req.user.userId` 是否為該 match 的成員

### 3. Web 登入後沒有儲存 role
- **位置**：`apps/web/app/(auth)/login/page.tsx`
- **問題**：登入 response 有回傳 `role`，但 web 沒有存到 localStorage，role-based 功能會壞掉
- **修法**：`localStorage.setItem('user_role', data.role)`

### 4. 約會取消的 recipientId 邏輯可能選錯人
- **位置**：`apps/backend/src/meeting/meeting.service.ts`
- **問題**：penalty 扣款時 recipientId 計算邏輯在邊界情況可能選到發起人自己
- **修法**：需要對照 match.userAId / userBId 重新驗證

### 5. 錢包 escrow 沒有防止 race condition
- **位置**：`apps/backend/src/wallet/wallet.service.ts`
- **問題**：同時兩個請求扣款可能導致餘額變成負數
- **修法**：用 DB transaction 或 Redis atomic 操作

---

## 🟠 High（功能不完整）

### 6. 手機版 GPS 座標寫死台北
- **位置**：`apps/mobile/app/(app)/(tabs)/swipe.tsx` line ~160
- **問題**：`{ lat: 25.0330, lng: 121.5654 }` 寫死，沒用 Expo Location API
- **修法**：`expo-location` 取得真實位置

### 7. Web 版 GPS 也是寫死台北
- **位置**：`apps/web/app/(app)/swipe/page.tsx` line ~26
- **修法**：用 `navigator.geolocation.getCurrentPosition()`

### 8. QR 掃碼是假的（模擬按鈕）
- **位置**：`apps/mobile/app/(app)/chat/[matchId].tsx`
- **問題**：「模擬掃碼成功」按鈕不是真的 camera，只是假觸發
- **修法**：接 `expo-camera` 或 `expo-barcode-scanner`

### 9. 個人資料 stats 是假資料
- **位置**：`apps/mobile/app/(app)/(tabs)/profile.tsx`
- **問題**：配對數顯示 '12'、訊息數顯示 '4'，是 hardcode 的
- **修法**：後端新增 `GET /users/me/stats` endpoint，回傳真實數字

### 10. Web Onboarding 不能上傳照片
- **位置**：`apps/web/app/onboarding/page.tsx`
- **問題**：頁面直接顯示「Web 版暫不支援照片上傳，請使用 App」，點確認就直接進 app，沒有驗證
- **修法**：要麼實作 web 上傳，要麼強制要求用 app 才能完成驗證

### 11. Swipe 篩選按鈕無功能
- **位置**：`apps/mobile/app/(app)/(tabs)/swipe.tsx`、`apps/web/app/(app)/swipe/page.tsx`
- **問題**：Header 的 Sliders icon 點下去沒反應
- **修法**：實作距離、年齡等篩選 UI

### 12. 個人檔案無法編輯
- **位置**：mobile & web profile 頁面
- **問題**：設定頁按鈕（編輯毛孩檔案 等）點下去沒有任何動作
- **修法**：跳出 form 或跳到編輯頁面

---

## 🟡 Medium（體驗問題）

### 13. Chat 沒有分頁，舊訊息讀不到
- **位置**：mobile & web chat detail
- **問題**：一次只 load 20 筆，沒有「往上滾動讀更多」
- **修法**：scroll-to-top 觸發 `?before=<cursor>` 分頁

### 14. Socket JWT 過期後連線沒有重新驗證
- **位置**：`apps/backend/src/chat/chat.gateway.ts`
- **問題**：連線時驗證 JWT，但 access token 15 分鐘過期後 socket 仍維持（或斷線），沒有 refresh 機制
- **修法**：client 端偵測 token 快到期時重連

### 15. setInterval 沒有清除（memory leak）
- **位置**：`apps/mobile/app/(app)/chat/[matchId].tsx` QR 倒計時
- **問題**：component unmount 時 interval 可能沒被清除
- **修法**：`useEffect` return 裡面加 `clearInterval`

### 16. Swipe Mock 資料 fallback 沒有提示
- **位置**：mobile & web swipe
- **問題**：API 失敗時 silent fallback 到 MOCK_PETS，用戶不知道看的是假資料
- **修法**：顯示 toast 或移除 mock fallback

### 17. 約會時間沒有驗證是否在過去
- **位置**：mobile & web chat detail，meeting 建立 form
- **問題**：理論上選 +1 天沒問題，但沒有防護
- **修法**：submit 前驗證 `scheduledAt > new Date()`

### 18. Web 版 swipe 只顯示第一張照片
- **位置**：`apps/web/app/(app)/swipe/page.tsx`
- **問題**：沒有照片輪播
- **修法**：加左右切換或自動輪播

### 19. 忘記密碼功能不存在
- **位置**：mobile & web login 頁
- **修法**：後端加 password reset email 流程

### 20. 距離顯示永遠是「附近」
- **位置**：`apps/mobile/app/(app)/(tabs)/swipe.tsx`
- **問題**：沒有換算實際距離顯示
- **修法**：後端 discover API 回傳距離，前端顯示「X km」

---

## 🟢 Low（小問題 / 清理）

### 21. Console.log 沒有移除
- **位置**：mobile register.tsx、login.tsx、api.ts
- **問題**：debug logs 外露
- **修法**：移除或換成 dev-only logger

### 22. Redis unread 和 likes key 沒有設 TTL
- **位置**：backend chat.controller.ts、swipe.service.ts
- **問題**：舊用戶/舊 match 的 key 永遠留在 Redis，記憶體 leak
- **修法**：`redis.expire(key, 30 * 24 * 60 * 60)` 設 30 天 TTL

### 23. Socket CORS 開放所有來源
- **位置**：`apps/backend/src/chat/chat.gateway.ts` `@WebSocketGateway({ cors: { origin: '*' } })`
- **修法**：改成 allowlist 特定 origin

### 24. Swipe 沒有防止重複快速點擊
- **位置**：mobile & web swipe
- **問題**：快速連點可以送出多個 swipe 請求
- **修法**：debounce 或 `sending` state

### 25. 交易紀錄查不到
- **位置**：mobile & web wallet（profile 頁）
- **問題**：有扣款但沒有 history 頁面
- **修法**：後端加 `GET /wallet/transactions`，前端加列表頁

### 26. 照片 upload 失敗沒有明確錯誤訊息
- **位置**：mobile onboarding.tsx
- **問題**：只說「照片上傳失敗」，不區分網路錯誤 vs 格式錯誤 vs 大小超限

### 27. 沒有 block / 檢舉功能
- **後端**：無 block endpoint
- **前端**：無 UI
- **修法**：至少後端先加 `POST /users/:id/block`

---

## 📋 尚未實作的功能（Feature Backlog）

| 功能 | 說明 |
|------|------|
| 真實 GPS 定位 | 手機 + web 都要用真實座標 |
| QR 掃碼驗證 | 換成真正 camera scan |
| Email 驗證 | 註冊後要驗證 email 才能用 |
| 忘記密碼 | email reset 流程 |
| 個人資料編輯 | 改 bio、改毛孩資訊、重新排序照片 |
| 聊天分頁 | 往上滾動讀舊訊息 |
| Swipe 篩選 | 距離、年齡等條件 |
| 交易紀錄 | 肉乾出入帳明細 |
| Block / 檢舉 | 用戶安全機制 |
| 在線狀態 | 顯示對方是否在線 |
| 推播通知 | 新訊息、配對成功 push notification |
| 真實金流 | 目前肉乾是假扣款 |
| 照片真正驗證流程 | 目前 mobile 上傳但沒有人工/AI 審核 |
| Web 照片上傳 | Onboarding 在 web 版跳過了 |

---

---

## 🔧 本次修復（第二輪）

| # | 問題 | 狀態 |
|---|------|------|
| 1 | `emitMatchNew` 從未被呼叫，另一方永遠不知道配對 | ✅ SwipeService 注入 ChatGateway，swipe 配對後呼叫 |
| 2 | `getMatch` endpoint 無授權 | ✅ 加 userId 驗證 + 加 partner 欄位 |
| 3 | Socket listener 在 mobile chat unmount 後未清除 | ✅ 改用具名函式 + cleanup closure |
| 4 | 取消約會 modal 顯示「模擬」UI | ✅ 改成真實一鍵取消，後端判斷 2hr 規則 |
| 5 | 驗證成功 modal 有 "PostGIS 空間解鎖過關" debug 文字 | ✅ 移除 |
| 6 | Redis `user:likes` / `unread` key 無 TTL，永久佔記憶體 | ✅ likes=90天, unread=30天 |
| 7 | Socket CORS 完全開放 | ✅ 改為 env-based allowlist |
| 8 | `match:new` 事件 + socket listener 修正 | ✅ mobile/web 都監聽 `match:new:${userId}` |
| 9 | Mobile GPS 寫死台北 | ✅ 改用 expo-location |
| 10 | Web GPS 寫死台北 | ✅ 改用 navigator.geolocation |
| 11 | Profile stats 假資料 | ✅ 後端加 `/users/me/stats`，兩端拉真實數字 |
| 12 | Web swipe 只顯示第一張照片 | ✅ 加照片輪播 + 進度條 |
| 13 | Web chat 無法取消約會 | ✅ 加取消按鈕 + confirm modal |
| 14 | Console.log 殘留 | ✅ 移除 login/register 的 debug logs |

---

## ✅ 已完成的功能

- [x] 雙角色登入 / 註冊（OWNER / LOVER）
- [x] JWT + refresh token（httpOnly cookie）
- [x] 401 → refresh → retry interceptor（mobile & web）
- [x] Swipe 左右滑 + 配對邏輯
- [x] 配對成功 Modal（mobile & web）
- [x] 即時聊天（Socket.IO）
- [x] 已讀回執（`chat:read` event）
- [x] 未讀角標（tab bar & chat list，mobile & web）
- [x] 投餵肉乾（treat）功能（mobile & web）
- [x] Go! 約會建立 / 取消 / QR 驗證（backend + mobile + web）
- [x] 肉乾錢包（餘額 / 儲值）
- [x] Web 版 80vh 手機框架
- [x] 手機版卡片漸層（expo-linear-gradient）
- [x] 約會建立後即時同步到對方畫面（socket `meeting:updated`）
- [x] 進入聊天室自動載入現有約會資訊
