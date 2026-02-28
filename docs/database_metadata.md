# Database Metadata
以下彙整Metadata內容，列出各資料表的欄位名稱、資料型態、是否可為 Null，以及名詞解釋。所有主鍵（如 AdminID、SellerID、ProductID、PageID、PageProductID 等）皆為 Identity 自動跳號。

## PlatformAdmin

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
| PlanType   | varchar(20)     | 否        | 訂閱方案類型（0=免費；1=進階付費）                                   |
| Status     | int             | 否        | 帳號狀態（0=審核中；1=營運中；2=停權；3=已關閉）                      |
| UpdatedAt  | datetime        | 否        | 最後更新時間                                                         |

## StorePage

| 欄位名稱    | 資料型態       | 可為 Null | 說明                                                                 |
|-------------|-----------------|-----------|----------------------------------------------------------------------|
| PageID      | int             | 否        | 頁面主鍵                                                             |
| SellerID    | int             | 否        | 所屬賣家                                                             |
| TemplateName| varchar(50)     | 否        | 前端套用版型代碼（對應預設 CSS 樣式名稱，決定店鋪視覺風格）          |
| IsPublished | bit             | 否        | 發佈狀態（0=草稿；1=已發布）                                         |
| PageUrl     | nvarchar(100)   | 否        | 店鋪唯一網址後綴 slug（避免與其他賣家混淆）                          |
| CreatedAt   | datetime        | 否        | 建立時間                                                             |
| UpdatedAt   | datetime        | 否        | 更新時間                                                             |

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
| IsActive    | bit              | 否        | 上架狀態（0=下架；1=上架中）                   |
| CreatedAt   | datetime         | 否        | 建立時間                                      |
| UpdatedAt   | datetime         | 否        | 更新時間                                      |

## Order

| 欄位名稱    | 資料型態        | 可為 Null | 說明                                                                 |
|-------------|------------------|-----------|----------------------------------------------------------------------|
| OrderID     | int              | 否        | 訂單主鍵                                                             |
| SellerID    | int              | 否        | 所屬賣家                                                             |
| BuyerName   | nvarchar(100)    | 否        | 購買人姓名                                                           |
| BuyerPhone  | nvarchar(20)     | 否        | 購買人電話（E.164 標準，例：+886912345678），禁止括號、空格、橫線，方便跨國際訊息相容                          |
| BuyerEmail  | nvarchar(255)    | 否        | 購買人 Email                                                          |
| BuyerAddress| nvarchar(300)    | 否        | 完整收件地址                                                         |
| OrderStatus | nvarchar(30)     | 否        | 訂單處理狀態（0=處理中；1=待出貨；2=已出貨；3=已送達；4=完成取貨；5=已取消） |
| TotalAmount | decimal(12,2)    | 否        | 訂單總金額（含優惠折扣與運費）                                       |
| PaymentStatus| int             | 否        | 支付狀態（0=未付款；1=已付款；2=退款中；3=已退款；4=失敗）           |
| CreatedAt   | datetime         | 否        | 建立時間                                                             |
| UpdatedAt   | datetime         | 否        | 更新時間                                                             |

## Payment

| 欄位名稱     | 資料型態       | 可為 Null | 說明                 |
|--------------|-----------------|-----------|----------------------|
| PaymentID    | int             | 否        | 付款紀錄主鍵         |
| OrderID      | int             | 否        | 所屬訂單             |
| PaymentMethod| nvarchar(50)    | 否        | 支付方式             |
| PaymentStatus| nvarchar(50)    | 否        | 支付狀態文字描述     |
| PaidAt       | datetime        | 否        | 實際完成付款時間     |

## Shipment

| 欄位名稱      | 資料型態       | 可為 Null | 說明                                                         |
|---------------|-----------------|-----------|--------------------------------------------------------------|
| ShipmentID    | int             | 否        | 物流紀錄主鍵                                                 |
| OrderID       | int             | 否        | 所屬訂單                                                     |
| ShippingMethod| nvarchar(50)    | 否        | 物流方式（例：7-11、宅配等）                                 |
| TrackingNumber| nvarchar(100)   | 否        | 物流單號（便於買家查詢）                                     |
| ShipmentStatus| nvarchar(30)    | 否        | 物流狀態（0=準備中；1=已出貨；2=配送中；3=已送達；4=退貨中） |
| ShippedAt     | datetime        | 否        | 賣家按下出貨的時間                                           |

## Orderdetail

| 欄位名稱     | 資料型態       | 可為 Null | 說明                                           |
|--------------|-----------------|-----------|------------------------------------------------|
| OrderdetailID| int             | 否        | 訂單明細主鍵                                   |
| OrderID      | int             | 否        | 所屬訂單                                       |
| ProductID    | int             | 否        | 對應商品                                       |
| Quantity     | int             | 否        | 購買數量（下單時必須大於 0）                   |
| UnitPrice    | decimal(12,2)   | 否        | 成交單價（凍結當下價格，避免後續調價影響訂單） |
