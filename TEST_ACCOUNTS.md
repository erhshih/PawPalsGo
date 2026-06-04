# 測試帳號

以下兩組帳號已預先建立在資料庫中，供本地開發測試使用。

> **前提**：需先啟動後端（`pnpm dev` in `apps/backend`）和資料庫（`docker compose up -d`）。

---

## 帳號一：Alice（飼主）

| 欄位 | 內容 |
|------|------|
| Email | `alice@pawpals.dev` |
| 密碼 | `Test1234!` |
| 身分 | 飼主（OWNER） |
| 性別 | 女 |
| 暱稱 | Alice 飼主 |
| 城市 | 台北市大安區 |
| 職稱 | UI 設計師 |
| 星座 | 天蠍座 |
| 身高 | 163 cm |
| 興趣 | 遛狗、攝影、咖啡、露營、動物 |
| 簡介 | 我有一隻超級黏人的柴犬，叫做麻糬。喜歡帶他去大安森林公園散步，歡迎一起遛狗！ |
| 位置 | 台北大安區（25.0264, 121.5432） |

---

## 帳號二：Ben（愛寵人）

| 欄位 | 內容 |
|------|------|
| Email | `ben@pawpals.dev` |
| 密碼 | `Test1234!` |
| 身分 | 愛寵人（LOVER） |
| 性別 | 男 |
| 暱稱 | Ben 愛寵人 |
| 城市 | 台北市信義區 |
| 職稱 | 軟體工程師 |
| 星座 | 獅子座 |
| 身高 | 178 cm |
| 興趣 | 貓咪、狗狗、健身、電影、旅遊 |
| 簡介 | 超愛貓咪和狗狗！雖然自己還沒養，但很嚮往有毛孩的生活。週末常在信義區活動，希望能認識愛動物的朋友～ |
| 位置 | 台北信義區（25.0330, 121.5654） |

---

## 測試建議

- **滑動配對**：用 Alice 登入，可以看到 Ben 出現在探索卡片（兩人位置相距約 4 km）
- **雙向 Like**：Alice 右滑 Ben → 再用 Ben 右滑 Alice → 觸發配對彈窗
- **聊天**：配對後可進入聊天室測試即時訊息（需 Socket.IO 連線正常）
- **iOS 模擬器**：`xcrun simctl location <device-id> set 25.0330,121.5654` 可把模擬器位置設為台北

## 注意事項

這兩組帳號**只在本地資料庫中存在**，每次 `docker compose down -v`（刪除 volume）後需重新建立。  
重建方式：執行專案根目錄的 `scripts/seed-test-accounts.sh`（若有的話），或手動打 API：

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@pawpals.dev","password":"Test1234!","role":"OWNER","gender":"FEMALE"}'

curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ben@pawpals.dev","password":"Test1234!","role":"LOVER","gender":"MALE"}'
```
