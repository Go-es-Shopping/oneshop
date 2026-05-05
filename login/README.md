# Goez Shop｜登入和註冊頁面說明

這個資料夾是 `Goez Shop` 的登入/註冊前端示範頁面，使用 **HTML + Tailwind CSS（CDN）** 製作，風格與主專案一致。

## 檔案結構

- `index.html`：登入頁
  - 輸入 Email、密碼
  - 「還沒有帳號？建立帳號」連到 `signup.html`
- `signup.html`：註冊頁
  - 輸入 Email、密碼、再次輸入密碼
  - 前端檢查：
    - 密碼至少 8 碼
    - 兩次密碼一致
  - 驗證通過後顯示「已寄送驗證信到 ...」提示視窗（示範）

## 使用方式

1. 直接用瀏覽器開啟：
   - `index.html`（登入頁）
2. 或使用本地伺服器（建議）：
   - 例如 `npx serve .` 後開啟對應網址

## 目前為前端示範（Demo）

- 不會真的建立帳號
- 不會真的寄送驗證信
- 不會真的登入
- 提示視窗與表單驗證皆為前端模擬流程

## 後續可串接後端項目

- `POST /api/auth/signin`：登入
- `POST /api/auth/signup`：註冊
- `POST /api/auth/send-verification`：寄送驗證信
- `POST /api/auth/verify-email`：驗證信箱

## 設計風格來源

此專案沿用根目錄的規範：

- `STYLE_GUIDE.md`
- `base-template.html`

若新增頁面，建議先依上述規範建立，確保與主專案一致。

