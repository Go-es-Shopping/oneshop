# 店鋪設置與整合｜Goez Shop 後台

使用 **HTML + Tailwind CSS（CDN）** 建立的後台管理頁面，風格與 Goez Shop Figma 設計一致。

## 專案結構

- `index.html`：店鋪設置與整合單頁，包含：
  - **網域管理**：綁定自訂網域、DNS CNAME 說明
  - **金物流開通嚮導**：步驟式介面（LINE Pay、信用卡、超商取貨）
  - **多權限管理**：店長與小幫手的查看／編輯權限說明與邀請
- `login/`：登入／註冊
- `customer-order/`：買家查詢訂單
- `i18n-core.js`：全站共用多語言核心（語系存 `localStorage`：`goezLang`）
- `i18n-store.js`：店鋪設置頁文案（中／英／日）

## 多語言

右上角下拉可切換：**中文、English、日本語**。  
語系全站共用，切換後到 `login`、`customer-order` 也會記住。若先前選過已移除的語系，會自動重設為中文。

## 使用方式

1. 在本機打開 `index.html`（可直接用瀏覽器開啟，或使用 Live Server / `npx serve .`）。
2. 側邊欄可點選「網域管理」「金物流開通嚮導」「多權限管理」捲動至對應區塊。

Tailwind 透過 CDN 載入，無需額外建置或編譯步驟。
