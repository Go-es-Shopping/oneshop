# Goez Shop｜Costumer Orders（買家訂單）

買家端「查詢訂單」頁面專案（以訂單編號 + 聯絡電話查詢單筆訂單）。

## 狀態

- 版型與風格：沿用主專案規範（見下方模板）
- 資料表與 API：**已整理** → 見 [`SCHEMA.md`](./SCHEMA.md)
- 頁面：**查詢頁 + 詳情頁**（跳轉流程）
- **多語言**：中文、英文、日文、越南文、西班牙文（與store-setting共用 `goezLang`）

## 檔案結構

| 檔案 | 說明 |
|------|------|
| [`index.html`](./index.html) | 查詢表單（訂單編號、聯絡電話） |
| [`order-detail.html`](./order-detail.html) | 訂單詳情（查詢成功後跳轉） |
| [`demo-orders.js`](./demo-orders.js) | 示範資料與查詢邏輯（兩頁共用） |
| [`i18n.js`](./i18n.js) | 本模組文案（需搭配根目錄 `../i18n-core.js`） |
| [`SCHEMA.md`](./SCHEMA.md) | 資料表與 API 對照 |

## 多語言

右上角下拉選單可切換：

| 代碼 | 語言 |
|------|------|
| `zh-Hant` | 中文（預設） |
| `en` | English |
| `ja` | 日本語 |
| `vi` | Tiếng Việt |
| `es` | Español |

語系存於 `localStorage`（`goezLang`），與store-setting、`sign-up` 共用。

## 流程

1. 買家在 `index.html` 輸入訂單編號、電話 → 按「查詢」
2. 驗證通過 → 訂單資料寫入 `sessionStorage` → **跳轉** `order-detail.html`
3. 詳情頁顯示該筆訂單；「重新查詢」回到 `index.html`
4. 若直接開啟 `order-detail.html` 且無資料 → 自動回到 `index.html`

## 示範訂單

| 說明 | 訂單編號 | 電話 |
|------|----------|------|
| 已完成 | `10032` | `+886912345678` |
| 未付款 | `10041` | `+886912345678` |
| 待出貨 | `10086` | `+886912345678` |

## 模板來源

- `../STYLE_GUIDE.md`
- `../base-template.html`

本地預覽：在專案根目錄執行 `npx serve .` 後開啟 `/buyer-orders/`。
