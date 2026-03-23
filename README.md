# oneshop
## 資料庫關聯圖 (Database Schema)
![資料庫圖表](./images/Shopping-db-diagram.jpg)
## API規格書
#### 技術開發規範
1. 命名規範：全專案 API 欄位強制對齊資料庫大寫命名（例：SellerID, ProductID）。
2. 多語系支援：所有查詢 API 均支援 ?lang= 參數切換語系（預設為 zh-TW）。
3. 資料格式：金額採 decimal(12,2)，電話採 E.164 國際標準（例：+886...）。
4. 狀態代碼：統一使用數值（0, 1, 2...），具體含義見各模組說明。
- IsPublished、IsActive、isFeatured 使用位元值（0/1）
- PlanType：0=免費；1=進階付費
- Seller.Status：0=審核中；1=營運中；2=停權；3=已關閉
- OrderStatus：0=處理中；1=待出貨；2=已出貨；3=已送達；4=完成取貨；5=已取消訂單
- PaymentStatus：0=未付款；1=已付款；2=退款中；3=已退款；4=失敗
- ShipmentStatus：0=準備中；1=已出貨；2=配送中；3=已送達；4=退貨中
- BuyerPhone 需採 E.164 標準格式（例：+886912345678）
- Price、TotalAmount、UnitPrice 為小數（兩位）

### Auth 模組（賣家帳戶）
登入
- Method: POST
- Endpoint: /api/auth/login
- Query Parameters: 無
- Response JSON 範例
```json
{
  "SellerID": 123,
  "SellerName": "ACME",
  "StoreName": "ACME Store",
  "Email": "owner@acme.com",
  "PlanType": 1,
  "Status": 1,
  "AccessToken": "JWT_TOKEN"
}
```
 - 狀態代碼說明
   - PlanType：0=免費；1=進階付費
   - Status：0=審核中；1=營運中；2=停權；3=已關閉

- Method: GET
- Endpoint: /api/auth/me
- Query Parameters: 無
- Response JSON 範例
```json
{
  "SellerID": 123,
  "SellerName": "ACME",
  "StoreName": "ACME Store",
  "Email": "owner@acme.com",
  "Phone": "+886912345678",
  "PlanType": 1,
  "Status": 1
}
```

 - 狀態代碼說明
   - OrderStatus：0=處理中；1=待出貨；2=已出貨；3=已送達；4=完成取貨；5=已取消訂單
   - PaymentStatus：0=未付款；1=已付款；2=退款中；3=已退款；4=失敗

 - 狀態代碼說明
   - PlanType：0=免費；1=進階付費
   - Status：0=審核中；1=營運中；2=停權；3=已關閉

登出
- Method: POST
- Endpoint: /api/auth/logout
- Query Parameters: 無
- Response JSON 範例
```json
{ "Success": true }
```

### Store 模組（頁面佈置）
查詢賣家所有頁面（含語系摘要）
- Method: GET
- Endpoint: /api/store/pages
- Query Parameters: SellerID, IsPublished（0/1）, lang（例如 zh-TW）
- Response JSON 範例
```json
[
  {
    "PageID": 1,
    "SellerID": 123,
    "TemplateName": "OnePageV1",
    "IsPublished": 1,
    "PageUrl": "acme",
    "CreatedAt": "2026-03-02",
    "UpdatedAt": "2026-03-02",
    "PageContent": {
      "LanguageCode": "zh-TW",
      "PageTitle": "ACME 一頁購物",
      "PageDescription": "精選商品與限時優惠",
      "CTA_Text": "立即下單"
    },
    "PageProducts": [
      {
        "PageProductID": 9001,
        "PageID": 1,
        "ProductID": 2001,
        "DisplayOrder": 1,
        "isFeatured": 1,
        "CreatedAt": "2026-03-02",
        "UpdatedAt": "2026-03-02"
      }
    ]
  }
]
```

 - 狀態代碼說明
   - IsPublished：0=草稿；1=已發布

取得單一頁面（依語系回傳內容）
- Method: GET
- Endpoint: /api/store/pages/{PageID}
- Query Parameters: lang（例如 zh-TW）
- Response JSON 範例
```json
{
  "PageID": 1,
  "SellerID": 123,
  "TemplateName": "OnePageV1",
  "IsPublished": 1,
  "PageUrl": "acme",
  "CreatedAt": "2026-03-02",
  "UpdatedAt": "2026-03-02",
  "PageContent": {
    "PageContentID": 501,
    "PageID": 1,
    "LanguageCode": "zh-TW",
    "PageTitle": "ACME 一頁購物",
    "PageDescription": "精選商品與限時優惠",
    "CTA_Text": "立即下單"
  },
  "PageProducts": [
    {
      "PageProductID": 9001,
      "PageID": 1,
      "ProductID": 2001,
      "DisplayOrder": 1,
      "isFeatured": 1,
      "CreatedAt": "2026-03-02",
      "UpdatedAt": "2026-03-02"
    }
  ]
}
```

 - 狀態代碼說明
   - IsPublished：0=草稿；1=已發布
   - isFeatured：0=否；1=是

### Product 模組（商品與多語系）
查詢商品列表（可依頁面與上架狀態，支援語系）
- Method: GET
- Endpoint: /api/products
- Query Parameters: SellerID, PageID, IsActive, lang
- Response JSON 範例
```json
[
  {
    "ProductID": 2001,
    "SellerID": 123,
    "ProductImg": "https://cdn.example.com/p/2001.png",
    "Price": 1990.00,
    "Stock": 50,
    "IsActive": 1,
    "LanguageCode": "zh-TW",
    "ProductName": "ACME 經典組合",
    "ProductDescription": "人氣暢銷，限時優惠"
  }
]
```

 - 狀態代碼說明
   - IsActive：0=下架；1=上架中

取得單一商品（依語系回傳名稱與描述）
- Method: GET
- Endpoint: /api/products/{ProductID}
- Query Parameters: lang
- Response JSON 範例
```json
{
  "ProductID": 2001,
  "SellerID": 123,
  "ProductImg": "https://cdn.example.com/p/2001.png",
  "Price": 1990.00,
  "Stock": 50,
  "IsActive": 1,
  "LanguageCode": "zh-TW",
  "ProductName": "ACME 經典組合",
  "ProductDescription": "人氣暢銷，限時優惠"
}
```

 - 狀態代碼說明
   - IsActive：0=下架；1=上架中

### Order 模組（交易訂單）
建立訂單（單頁結帳流程）
- Method: POST
- Endpoint: /api/orders
- Query Parameters: 無
- Response JSON 範例
```json
{
  "OrderID": 70001,
  "SellerID": 123,
  "BuyerName": "王小明",
  "BuyerPhone": "+886912345678",
  "BuyerEmail": "buyer@example.com",
  "BuyerAddress": "台北市中正區 XX 路 1 號",
  "OrderStatus": 0,
  "PaymentStatus": 0,
  "TotalAmount": 1990.00,
  "Items": [
    {
      "OrderdetailID": 1,
      "OrderID": 70001,
      "ProductID": 2001,
      "Quantity": 1,
      "UnitPrice": 1990.00
    }
  ]
}
```

 - 狀態代碼說明
   - OrderStatus：0=處理中；1=待出貨；2=已出貨；3=已送達；4=完成取貨；5=已取消訂單
   - PaymentStatus：0=未付款；1=已付款；2=退款中；3=已退款；4=失敗
 - 欄位備註
   - Quantity 必須大於 0
   - TotalAmount、UnitPrice 為 decimal(12,2)

查詢訂單詳情（含物流與付款摘要）
- Method: GET
- Endpoint: /api/orders/{OrderID}
- Query Parameters: 無
- Response JSON 範例
```json
{
  "OrderID": 70001,
  "SellerID": 123,
  "BuyerName": "王小明",
  "OrderStatus": 0,
  "PaymentStatus": 0,
  "TotalAmount": 1990.00,
  "Shipment": {
    "ShipmentID": 3001,
    "OrderID": 70001,
    "ShippingMethod": "HomeDelivery",
    "TrackingNumber": "ACME123456",
    "ShipmentStatus": 0,
    "ShippedAt": "2026-03-01T10:00:00Z"
  },
  "Payment": {
    "PaymentID": 4001,
    "OrderID": 70001,
    "PaymentMethod": "CreditCard",
    "PaymentStatus": 0
  },
  "Items": [
    {
      "OrderdetailID": 1,
      "OrderID": 70001,
      "ProductID": 2001,
      "Quantity": 1,
      "UnitPrice": 1990.00
    }
  ]
}
```

 - 狀態代碼說明
   - OrderStatus：0=處理中；1=待出貨；2=已出貨；3=已送達；4=完成取貨；5=已取消訂單
   - PaymentStatus：0=未付款；1=已付款；2=退款中；3=已退款；4=失敗
   - ShipmentStatus：0=準備中；1=已出貨；2=配送中；3=已送達；4=退貨中
 - 欄位備註
  - TrackingNumber 不可為 null
   - ShippedAt 為 ISO8601 時間

查詢訂單列表（賣家後台）
- Method: GET
- Endpoint: /api/orders
- Query Parameters: SellerID, OrderStatus, PaymentStatus
- Response JSON 範例
```json
[
  {
    "OrderID": 70001,
    "SellerID": 123,
    "OrderStatus": 0,
    "PaymentStatus": 0,
    "TotalAmount": 1990.00
  }
]
```
