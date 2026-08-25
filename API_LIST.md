# OneShop API 實體路由清單

| 模組 | HTTP 方法 | 完整 URL 路徑 | 對應資料表 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **身份驗證** | POST | `/api/auth/login` | `Seller` | 賣家登入 (回傳 Token) |
| | GET | `/api/auth/me` | `Seller` | 取得當前登入賣家資訊 |
| | POST | `/api/auth/logout` | - | 登出 |
| **商品管理** | GET | `/api/products/` | `Product`, `PageContent`, `PageProduct`, `StorePage` | 取得商品列表 (支援 SellerID 篩選) (瀏覽器可測) |
| | GET | `/api/products/:ProductID` | `Product`, `PageContent`, `PageProduct`, `StorePage` | 取得單一商品詳情 (瀏覽器可測) |
| | POST | `/api/products/` | `Product` | 新增商品 |
| | PUT | `/api/products/:ProductID` | `Product` | 更新商品資訊 |
| | DELETE | `/api/products/:ProductID` | `Product` | 刪除商品 |
| **商店頁面** | GET | `/api/store/pages` | `StorePage`, `PageContent`, `PageProduct`, `Product` | 取得商店頁面列表 (瀏覽器可測) |
| | GET | `/api/store/pages/:PageID` | `StorePage`, `PageContent`, `PageProduct`, `Product` | 取得單一商店頁面內容 (包含商品) (瀏覽器可測) |
| | GET | `/api/store/template/:pageId` | `StorePage`, `PageContent`, `PageProduct`, `Product` | 消費者前台動態載入模板 (依數字 ID 渲染賣場與商品) |
| | GET | `/api/store/store/:slug` | `StorePage`, `PageContent`, `PageProduct`, `Product` | 消費者前台動態載入模板 (依自訂專屬網址 Slug 渲染賣場) |
| | POST | `/api/store/upload-logo` | - | 上傳商店 Logo 圖片 (支援 Multer 處理，限制 5MB) |
| | POST | `/api/store/pages/:PageID/update` | `StorePage`, `PageContent` | 更新商店頁面設定與自訂專屬網址 (PageUrl) |
| | POST | `/api/store/create-new-shop` | `StorePage` | 建立全新空白賣場|
| | PUT | `/api/store/pages/:PageID` | `StorePage` | 更新商店頁面基本資訊 (含 Logo 路徑、標題、發佈狀態) |
| | PUT | `/api/store/content/:ContentID` | `PageContent` | 更新頁面特定區塊內容 (如 CTA 文字、產品敘述) |
| **訂單管理** | POST | `/api/orders/` | `Order`, `Orderdetail`, `Product` | 建立新訂單 (包含扣庫存邏輯) |
| | GET | `/api/orders/` | `Order` | 取得訂單列表 (支援 SellerID 篩選) (瀏覽器可測) |
| | GET | `/api/orders/:OrderID` | `Order`, `Orderdetail`, `Shipment`, `Payment` | 取得訂單詳情 (包含明細、物流、付款) (瀏覽器可測) |
| | PATCH | `/api/orders/:OrderID/status` | `Order` | 更新訂單狀態 |
| **賣家訂單 (新增sellerorder.js)** | POST | `/` | `Order`, `Orderdetail`, `Product` | 建立訂單 (支援 Mock) |
| | GET | `/all` <br> GET `/` | `Order` | 查詢訂單列表 (支援 `OrderStatus` 篩選與 Mock) |
| | GET | `/:OrderID/details` | `Order`, `Orderdetail`, `Shipment`, `Payment`  | 查詢特定訂單的明細列表 |
| | PATCH / PUT | `/:OrderID/status` | `Order` | 更新訂單狀態 |
| | GET | `/:OrderID` | `Order`, `Orderdetail`, `Shipment`, `Payment` | 查詢單筆訂單詳情 |
| | DELETE | `/:OrderID` |`Order` | 刪除指定訂單 |
| **賣家中心** | POST | `/api/seller/login` | `Seller` | 賣家中心登入 |
| | GET | `/api/seller/me` | `Seller` | 賣家中心取得個人資料 (瀏覽器可測) |
| **後台管理** | POST | `/api/admin/login` | `PlatformAdmin` | 平台管理員登入 |
| | GET | `/api/admin/analytics` | `PageVisit`, `Order`, `Product` | 營運數據分析 (含轉換率、UTM 來源分布，瀏覽器可測) |
| **購物與結帳** | POST | `/api/checkout/calculate` | `Product` | 購物車金額計算 (含庫存檢查、滿額折扣) |
| | POST | `/api/checkout` | `Order`, `Orderdetail`, `Product` | 結帳並建立訂單 (包含優惠券套用) |
| **數據追蹤** | POST | `/api/track/view` | `PageVisit` , `Product` , `Seller` | 瀏覽紀錄追蹤 (支援商品 ID、來源網址、SessionID 與 Metadata 擴充) |
| **優惠券管理** | GET | `/api/coupons` | `Coupon` | 取得賣家已設定的所有優惠券列表 |
| | POST | `/api/coupons` | `Coupon` | 新增一筆優惠券設定（包含折扣種類、門檻與時間限制） |
| | DELETE | `/api/coupons/:CouponID` | `Coupon` | 刪除指定的優惠券 |
| | POST | `/api/coupons/apply` | `Coupon` | 驗證並套用優惠券 |
| **金流服務** | POST | `/api/payment/notify` | `Payment`, `Order` | 接收藍新金流幕後背景通知 (Webhook)，自動解密並更新訂單付款狀態、寫入 TradeNo 與付款時間 |
| **AI 功能** | POST | `/api/ai/generate-copy` | `無` | 透過AI自動生成文案 |
| | POST | `/api/ai/edit-image` | `無` | 透過AI編輯處理圖片 |
