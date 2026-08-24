# Database Metadata
以下彙整Metadata內容，列出各資料表的欄位名稱、資料型態、是否可為 Null，以及名詞解釋。所有主鍵（如 AdminID、SellerID、ProductID、PageID、PageProductID 等）皆為 Identity 自動跳號。(持續待更新，可做開發參考)

## PlatformAdmin (保留資料庫欄位 未來可優化前台介面與審核機制)

| 欄位名稱     | 資料型態        | 可為 Null | 說明                                     |
|--------------|------------------|-----------|------------------------------------------|
| AdminID      | int              | 否        | 管理員主鍵                                |
| AdminName    | nvarchar(100)    | 否        | 管理員真實姓名                            |
| Email        | nvarchar(255)    | 否        | 電子郵件                                  |
| PasswordHash | nvarchar(255)    | 否        | 經過雜湊處理的密碼                        |
| Role         | nvarchar(50)     | 否        | 管理員權限（0=管理員；1=客服）             |
| CreatedAt    | datetime         | 否        | 資料建立時間                              |

## Seller

| 欄位名稱   | 資料型態       | 可為 Null | 說明                                                                 |
|------------|-----------------|-----------|----------------------------------------------------------------------|
| SellerID   | int             | 否        | 賣家主鍵                                                             |
| SellerName | nvarchar(100)   | 否        | 賣家真實姓名                                                         |
| StoreName  | nvarchar(100)   | 否        | 店鋪名稱                                                             |
| Email      | varchar(255)    | 否        | 電子郵件                                                             |
| PasswordHash | varchar(255)  | 否        | 雜湊後密碼                                                           |
| Phone      | varchar(20)     | 否        | 聯絡電話（E.164 國際格式，例：+886912345678）                        |
| CreatedAt  | datetime        | 否        | 建立時間                                                             |
| PlanType   | varchar(20)     | 否        | 訂閱方案類型（free=免費；premium=進階付費）(保留資料庫欄位 未來可優化做付費功能進階)                 |
| Status     | int             | 否        | 帳號狀態（0=審核中；1=營運中；2=停權；3=已關閉）(保留資料庫欄位 未來可優化使平台管理員審核機制)    |
| UpdatedAt  | datetime        | 否        | 最後更新時間                                                         |

## StorePage

| 欄位名稱    | 資料型態       | 可為 Null | 說明                                                                 |
|-------------|-----------------|-----------|----------------------------------------------------------------------|
| PageID      | int             | 否        | 頁面主鍵                                                             |
| SellerID    | int             | 否        | 所屬賣家                                                             |
| TemplateName| varchar(50)     | 否        | 前端套用版型代碼（對應預設 CSS 樣式名稱，決定店鋪視覺風格）          |
| IsPublished | bit             | 否        | 發佈狀態（0=草稿；1=已發布）                                         |
| PageUrl     | nvarchar(100)   | 否        | 店鋪唯一網址後綴 slug（避免與其他賣家混淆）                          |
| CreatedAt   | datetime        | 是        | 建立時間                                                             |
| UpdatedAt   | datetime        | 是        | 更新時間                                                             |
| StoreLogo | nvarchar(MAX)     | 是        | 商店商標圖片(儲存圖片的相對路徑或 URL (例如: /uploads/logos/filename.jpg)。不建議儲存 Base64 原始碼以維護效能。)                                         |
| ThemeColor   | varchar(50)        | 是        | 頁面主題顏色，初始設置"冷靜石板"                                           |
| ThemeFont   | varchar(50)        | 是        | 頁面主題字體，初始設置"現代黑體"                                             |
| StoreEmail   | nvarchar(255)        | 是        | 商家賣場聯絡郵件(聯絡我們)                                                  |
| StorePhone   | nvarchar(50)        | 是        | 商家賣場聯絡電話(聯絡我們)                                                   |
| StoreBankAccount   | nvarchar(100)        | 是        | 商家賣場收款銀行帳戶(由平台統一代收顧客消費，在每月5號撥款轉帳到此帳戶，請填寫正確的銀行代碼和帳號)                      |

## PageContent

| 欄位名稱         | 資料型態       | 可為 Null | 說明                                                                 |
|------------------|-----------------|-----------|----------------------------------------------------------------------|
| PageContentID    | int             | 否        | 多語系文案主鍵                                                       |
| PageID           | int             | 否        | 所屬頁面                                                             |
| ProductID        | int             | 否        | 所屬商品（用於商品名稱與描述多語系）                                 |
| LanguageCode     | nvarchar(10)    | 否        | ISO 語系代碼（例：zh-TW、en-US），確保單一頁面不重複定位同語
系內容                                     |
| PageTitle        | nvarchar(200)   | 是        | 頁面標題（支援多國語系）                                             |
| PageDescription  | nvarchar(MAX)   | 是        | 店鋪詳細介紹（支援多國語系文案）                                     |
| ProductName      | nvarchar(200)   | 否        | 商品名稱（支援多國語系）                                             |
| ProductDescription | nvarchar(MAX) | 是        | 商品詳細介紹（支援多國語系）                                         |
| CTA_Text         | nvarchar(100)   | 否        | 行動呼籲按鈕文字（前台導購；多語系）                                  |
| CreatedAt        | datetime        | 否        | 建立時間                                                             |
| UpdatedAt        | datetime        | 否        | 更新時間                                                             |

## PageProduct

| 欄位名稱     | 資料型態   | 可為 Null | 說明                                   |
|--------------|------------|-----------|----------------------------------------|
| PageProductID| int        | 否        | 頁面商品關聯主鍵                       |
| PageID       | int        | 否        | 所屬頁面                               |
| ProductID    | int        | 否        | 關聯商品                               |
| DisplayOrder | int        | 否        | 商品顯示排序                           |
| isFeatured   | bit        | 否        | 是否為精選／推薦商品（0=否；1=是）     |
| CreatedAt    | datetime   | 否        | 建立時間                               |
| UpdatedAt    | datetime   | 否        | 更新時間                               |

## Product

| 欄位名稱    | 資料型態        | 可為 Null | 說明                                          |
|-------------|------------------|-----------|-----------------------------------------------|
| ProductID   | int              | 否        | 商品主鍵                                      |
| SellerID    | int              | 否        | 所屬賣家                                      |
| ProductImg  | nvarchar(MAX)    | 否        | 商品主圖 URL 路徑                              |
| Price       | decimal(18,2)    | 否        | 商品單價                                      |
| Stock       | int              | 否        | 庫存數量（下單成功應連動扣除）                 |
| IsActive    | bit              | 否        | 上架狀態（false=下架；true=上架中）                   |
| CreatedAt   | datetime         | 否        | 建立時間                                      |
| UpdatedAt   | datetime         | 否        | 更新時間                                      |

## Order

| 欄位名稱    | 資料型態        | 可為 Null | 說明                                                                 |
|-------------|------------------|-----------|----------------------------------------------------------------------|
| OrderID     | int              | 否        | 訂單主鍵                                                             |
| SellerID    | int              | 否        | 所屬賣家                                                             |
| CouponID    | int             | 是        | 使用哪張優惠卷 (FK)                                       |
| CouponCode    | varchar(50)    | 是        | 優惠卷代碼                                        |
| DiscountValue    | decimal(10,2)    | 是        | 折抵金額                                       |
| BuyerName   | nvarchar(100)    | 否        | 購買人姓名                                                           |
| BuyerPhone  | nvarchar(20)     | 否        | 購買人電話（E.164 標準，例：+886912345678），禁止括號、空格、橫線，方便跨國際訊息相容                          |
| BuyerEmail  | nvarchar(255)    | 否        | 購買人 Email                                                          |
| BuyerAddress| nvarchar(300)    | 否        | 完整收件地址                                                         |
| OrderStatus | nvarchar(30)     | 否        | 訂單處理狀態（0=處理中；1=待出貨；2=已出貨；3=已送達；4=完成取貨；5=已取消） |
| TotalAmount | decimal(12,2)    | 否        | 訂單總金額（含優惠折扣與運費）                                       |
| PaymentStatus| int             | 否        | 支付狀態（0=未付款；1=已付款；2=退款中；3=已退款；4=失敗）           |
| UTM_Source | nvarchar(100)    | 是        | 廣告來源標籤（由 PageVisit 自動帶入，用於廣告成效分析）                                       |
| SessionID | nvarchar(100)    | 是        | 關聯至 PageVisit.SessionID，用於計算成交轉換率 (Conversion Rate)                                       |
| InvoiceType | nvarchar(50)     | 是        | 發票載具類型（member=會員載具；barcode=手機條碼）                                                         |
| CarrierCode | nvarchar(50)     | 是        | 手機條碼字串（當 InvoiceType 為 barcode 時填寫，格式為 / 開頭共 8 碼）                                      |
| CreatedAt   | datetime         | 否        | 建立時間                                                             |
| UpdatedAt   | datetime         | 否        | 更新時間                                                             |

## Payment

| 欄位名稱     | 資料型態       | 可為 Null | 說明                 |
|--------------|-----------------|-----------|----------------------|
| PaymentID    | int             | 否        | 付款紀錄主鍵         |
| OrderID      | int             | 否        | 所屬訂單             |
| PaymentMethod| nvarchar(50)    | 否        | 支付方式('CreditCard'信用卡, 'atm'轉帳, 'cod'貨到付款)      |
| PaymentStatus| int             | 否        | 支付狀態（0=未付款；1=已付款；2=退款中；3=已退款；4=失敗）     |
| PaidAt       | datetime        | 否        | 實際完成付款時間     |
| TradeNo      | nvarchar(100)   | 是        | 蓝新金流官方交易序號（對帳用） |

## Shipment

| 欄位名稱      | 資料型態       | 可為 Null | 說明                                                         |
|---------------|-----------------|-----------|--------------------------------------------------------------|
| ShipmentID    | int             | 否        | 物流紀錄主鍵                                                 |
| OrderID       | int             | 否        | 所屬訂單                                                     |
| ShippingMethod| nvarchar(50)    | 否        | 物流方式（例：7-11、宅配等）                                 |
| TrackingNumber| nvarchar(100)   | 是        | 物流單號（便於買家查詢）                                     |
| ShipmentStatus| nvarchar(30)    | 否        | 物流狀態（0=處理中；1=待出貨；2=已出貨；3=已送達；4=完成取貨；5=已取消） |
| ShippedAt     | datetime        | 否        | 賣家按下出貨的時間                                           |

## Orderdetail

| 欄位名稱     | 資料型態       | 可為 Null | 說明                                           |
|--------------|-----------------|-----------|------------------------------------------------|
| OrderdetailID| int             | 否        | 訂單明細主鍵                                   |
| OrderID      | int             | 否        | 所屬訂單                                       |
| ProductID    | int             | 否        | 對應商品                                       |
| Quantity     | int             | 否        | 購買數量（下單時必須大於 0）                   |
| UnitPrice    | decimal(12,2)   | 否        | 成交單價（凍結當下價格，避免後續調價影響訂單） |

## PageVisit

| 欄位名稱     | 資料型態       | 可為 Null | 說明                                           |
|--------------|-----------------|-----------|------------------------------------------------|
| VisitID  | int             | 否        | 瀏覽紀錄主鍵 (Identity)                                   |
| ProductID    | int             | 是        | 被瀏覽的商品 (FK)                                       |
| SellerID     | int             | 是        | 所屬賣家 (FK)，用於賣家後台流量統計與多租戶隔離|
| PageType    | nvarchar(50)   | 否        | 頁面類型（例：Product 商品、Home 店鋪首頁、About 關於我們）|
| Referrer    | nvarchar(MAX)   | 是        | 來源網址（例：Google 搜尋、Facebook 廣告來源 URL）|
| IPAddress     | nvarchar(50)   |是        | 訪客 IP 位址，用於基礎地理位置分析與防詐欺過濾 |
| UserAgent     | nvarchar(MAX)   | 是        | 訪客裝置資訊（解析瀏覽器、作業系統版本以優化前端渲染） |
| SessionID     | nvarchar(100)   | 是        | 唯一工作階段 ID，用於追蹤從瀏覽到購買的完整轉換路徑 (Conversion Path) |
| Metadata     | nvarchar(MAX)   | 是        | AI 數據擴展接口：JSON 格式儲存非結構化數據（如 UTM 標籤、OpenAI 意圖預分析結果） |
| CreatedAt     | datetime   | 否        | 瀏覽發生的精確時間 |
## Coupon

| 欄位名稱    | 資料型態       | 可為 Null | 說明                                                                 |
|-------------|-----------------|-----------|----------------------------------------------------------------------|
| CouponID    | int             | 否        | 優惠券唯一識別碼 (Primary Key)                                       |
| SellerID    | int             | 是        | 由此賣家設定 (FK)                                       |
| Title       | nvarchar(100)   | 否        | 優惠券名稱（例如：2026年終優惠）                                     |
| Code        | varchar(50)     | 否        | 優惠券代碼（例如：SAVE2026，需具備唯一性）                           |
| DiscountType| nvarchar(50)    | 否        | 折扣種類（對應前端選擇的折扣規則類型，fixed（固定）/percentage（百分比）                               |
| MinSpend    | decimal(10,2)   | 是        | 最低訂單優惠金額限制                                   |
| DiscountValue   | decimal(10,2)   | 是        | 折扣金額/百分比（根據 DiscountType 類型決定）                                   |
| UsageLimit  | int             | 是        | 使用次數上限（未填代表不限制）                                       |
| TotalQuantity| int            | 是        | 總發行量（未填代表不限制）                                           |
| IsExclusive | bit             | 否        | 不可與其他優惠券並用（False=否；True=是）                                   |
| StartDate   | date            | 是        | 開始時間（優惠生效日）                                               |
| EndDate     | date            | 是        | 結束時間（優惠到期日）                                               |
| CreatedAt   | datetime        | 否        | 建立時間（預設為系統當前時間）                                       |