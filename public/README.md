# Goez Shop｜Costumer Orders（顧客訂單）

買家端「查詢訂單」頁面專案（以訂單編號 + 聯絡電話查詢單筆訂單）。

## 狀態

- 版型與風格：沿用主專案規範（見下方模板）
- 資料表與 API：**已整理** → 見 [`SCHEMA.md`](./SCHEMA.md)
- 頁面：**查詢頁 + 詳情頁**（跳轉流程）

## 檔案結構

| 檔案 | 說明 |
|------|------|
| [`index.html`](./index.html) | 查詢表單（訂單編號、聯絡電話） |
| [`order-detail.html`](./order-detail.html) | 訂單詳情（查詢成功後跳轉） |
| [`demo-orders.js`](./demo-orders.js) | 示範資料與查詢邏輯（兩頁共用） |
| [`SCHEMA.md`](./SCHEMA.md) | 資料表與 API 對照 |

## 流程

1. 買家在 `index.html` 輸入訂單編號、電話 → 按「查詢」
2. 驗證通過 → 訂單資料寫入 `sessionStorage` → **跳轉** `order-detail.html`
3. 詳情頁顯示該筆訂單；「重新查詢」回到 `index.html`
4. 若直接開啟 `order-detail.html` 且無資料 → 自動回到 `index.html`

## 示範訂單

- 訂單編號 `10032`、電話 `+886912345678`
- 訂單編號 `10041`、電話 `+886912345678`
- 訂單編號 `10086`、電話 `+886912345678`

## 模板來源

- `../STYLE_GUIDE.md`
- `../base-template.html`

本地預覽：在專案根目錄執行 `npx serve .` 後開啟 `/buyer-orders/`。
