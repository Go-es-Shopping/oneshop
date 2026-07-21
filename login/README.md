# Goez Shop｜登入／註冊

這個資料夾是 `Goez Shop` 的登入／註冊前端示範頁面，使用 **HTML + Tailwind CSS（CDN）** 製作，風格與主專案一致。

## 多語言

右上角可切換：**中文、English、日本語**。  
依賴 `../i18n-core.js` + `./i18n.js`；語系與店鋪設置、`customer-order` 共用（`goezLang`）。

## 檔案結構

- `index.html`：登入頁
  - 輸入 Email、密碼
  - 「還沒有帳號？建立帳號」連到 `signup.html`
- `signup.html`：賣家註冊頁（對應 **Seller** 資料表）
  - **基本資料**：SellerName（真實姓名）、StoreName（店鋪名稱）、Phone（E.164，例 `+886912345678`）
  - **帳號與密碼**：Email、Password → 後端雜湊為 **PasswordHash**
  - **服務條款**：須勾選同意；「服務條款」「隱私政策」以彈跳視窗顯示示範文案（支援三語）
  - 送出後示範：**Status = 0（審核中）**、驗證信提示視窗
  - 後端自動欄位（表單不填）：SellerID、CreatedAt、UpdatedAt
- `i18n.js`：登入／註冊文案

## 使用方式

1. 直接用瀏覽器開啟：
   - `index.html`（登入頁）
   - `signup.html`（註冊頁）
2. 或使用本地伺服器（建議）：
   - 在專案根目錄執行 `npx serve .` 後開啟 `/login/`

## 目前為前端示範（Demo）

- 不會真的建立 Seller 紀錄
- 不會真的寄送驗證信
- 不會真的登入
- 驗證通過後於 console 輸出示範 payload，並顯示成功視窗

## 後續可串接後端項目

- `POST /api/auth/signin`：登入（Email + 密碼）
- `POST /api/sellers` 或 `POST /api/auth/signup`：建立 Seller（含 PasswordHash；Status 預設 0）
- `POST /api/auth/send-verification`：寄送驗證信
- `POST /api/auth/verify-email`：驗證信箱

## Seller.Status（註冊後由後端設定）

| 值 | 說明 |
|----|------|
| 0 | 審核中（註冊預設） |
| 1 | 營運中 |
| 2 | 停權 |
| 3 | 已關閉 |

## 設計風格來源

此專案沿用根目錄的規範：

- `STYLE_GUIDE.md`
- `base-template.html`

若新增頁面，建議先依上述規範建立，確保與主專案一致。
