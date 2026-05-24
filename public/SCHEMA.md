# Buyer Orders｜資料表與 API 對照

供「買家查看自己的訂單」頁面設計欄位用。風格見 `../STYLE_GUIDE.md`。

---

## API 路由（後端）

| 方法 | 路徑 | 關聯 Model | 用途（買家端） |
|------|------|------------|----------------|
| POST | `/api/orders/` | Order, Orderdetail, Product | 建立訂單（含扣庫存） |
| GET | `/api/orders/` | Order | **訂單列表**（需確認是否依買家 ID 篩選） |
| GET | `/api/orders/:OrderID` | Order, Orderdetail, Shipment, Payment | **訂單詳情**（明細、物流、付款） |
| PATCH | `/api/orders/:OrderID/status` | Order | 更新訂單狀態（如取消，需與後端確認權限） |

> 列表 API 文件寫「可依 SellerID 篩選」；買家頁應改為依**登入買家**篩選，實作前請與後端確認參數名稱。

---

## 資料表關聯（簡圖）

```
Order (1) ──< Orderdetail (N) >── Product
   │
   ├── (1) Payment
   └── (1) Shipment
```

買家列表主體：**Order**  
詳情一次帶回：**Order + Orderdetail + Shipment + Payment**（對應 GET `/:OrderID`）

---

## Order（訂單主檔）

| 欄位 | 型別 | 列表顯示 | 詳情顯示 | 備註 |
|------|------|----------|----------|------|
| OrderID | int | ✓ 訂單編號 | ✓ | 主鍵 |
| SellerID | int | 可選（店鋪） | ✓ | 賣家 |
| BuyerName | nvarchar(100) | 通常不列 | ✓ | 買家姓名 |
| BuyerPhone | nvarchar(20) | 通常不列 | ✓ | E.164，勿含括號空白 |
| BuyerEmail | nvarchar(255) | 通常不列 | ✓ | |
| BuyerAddress | nvarchar(300) | 通常不列 | ✓ | 收件地址 |
| OrderStatus | nvarchar(30) | ✓ 狀態標籤 | ✓ | 見下方枚舉 |
| TotalAmount | decimal(12,2) | ✓ 金額 | ✓ | 含折扣運費 |
| PaymentStatus | int | ✓ 付款狀態 | ✓ | 見下方枚舉（與 Payment 表不同） |
| UTM_Source | nvarchar(100) | ✗ | 可選 | 行銷用，買家端可不顯示 |
| SessionID | nvarchar(100) | ✗ | ✗ | 分析用 |
| CreatedAt | datetime | ✓ 下單時間 | ✓ | |
| UpdatedAt | datetime | 可選 | ✓ | |

### OrderStatus 顯示文案

| 值 | 建議顯示 |
|----|----------|
| 0 | 處理中 |
| 1 | 待出貨 |
| 2 | 已出貨 |
| 3 | 已送達 |
| 4 | 完成取貨 |
| 5 | 已取消 |

### PaymentStatus（Order 表上的 int）

| 值 | 建議顯示 |
|----|----------|
| 0 | 未付款 |
| 1 | 已付款 |
| 2 | 退款中 |
| 3 | 已退款 |
| 4 | 付款失敗 |

---

## Orderdetail（訂單明細）

| 欄位 | 型別 | 詳情顯示 | 備註 |
|------|------|----------|------|
| OrderdetailID | int | 內部用 | 主鍵 |
| OrderID | int | — | 關聯訂單 |
| ProductID | int | 可顯示 | 可 JOIN Product 顯示圖片名稱 |
| Quantity | int | ✓ 數量 | 下單時 > 0 |
| UnitPrice | decimal(12,2) | ✓ 單價 | 凍結成交價 |

詳情區建議：**商品圖、名稱、單價 × 數量、小計**（名稱/圖來自 Product）

---

## Product（商品，明細用）

| 欄位 | 型別 | 買家詳情可用 | 備註 |
|------|------|--------------|------|
| ProductID | int | ✓ | |
| SellerID | int | 可選 | |
| ProductImg | nvarchar(MAX) | ✓ 圖片 URL | |
| Price | decimal(18,2) | 參考用 | 明細以 Orderdetail.UnitPrice 為準 |
| Stock | int | ✗ | 買家訂單頁不需顯示庫存 |
| IsActive | bit | ✗ | |
| CreatedAt / UpdatedAt | datetime | ✗ | |

---

## Shipment（物流）

| 欄位 | 型別 | 詳情顯示 | 備註 |
|------|------|----------|------|
| ShipmentID | int | 內部用 | |
| OrderID | int | — | |
| ShippingMethod | nvarchar(50) | ✓ | 例：7-11、宅配 |
| TrackingNumber | nvarchar(100) | ✓ | 可複製查詢 |
| ShipmentStatus | nvarchar(30) | ✓ | 見下方枚舉 |
| ShippedAt | datetime | ✓ | 賣家出貨時間 |

### ShipmentStatus 顯示文案

| 值 | 建議顯示 |
|----|----------|
| 0 | 準備中 |
| 1 | 已出貨 |
| 2 | 配送中 |
| 3 | 已送達 |
| 4 | 退貨中 |

---

## Payment（付款紀錄）

| 欄位 | 型別 | 詳情顯示 | 備註 |
|------|------|----------|------|
| PaymentID | int | 內部用 | |
| OrderID | int | — | |
| PaymentMethod | nvarchar(50) | ✓ | 信用卡、轉帳等 |
| PaymentStatus | nvarchar(50) | ✓ | 文字狀態（與 Order.PaymentStatus 不同欄位） |
| PaidAt | datetime | ✓ | 完成付款時間 |

詳情可同時顯示：**Order.PaymentStatus（整體）** + **Payment 表（方式與完成時間）**

---

## 建議頁面欄位（買家端）

### 查詢頁 `index.html`

- 輸入：**OrderID**（訂單編號）、**BuyerPhone**（聯絡電話）
- 驗證通過後跳轉 **`order-detail.html`**（示範以 `sessionStorage` 帶訂單資料）
- 建議限制：僅可查 **6 個月內** 訂單（前端／後端皆可實作）

### 詳情頁 `order-detail.html`

1. **訂單摘要**：編號、狀態、金額、下單時間  
2. **收件資訊**：姓名、電話、地址  
3. **商品明細**：圖、名稱、單價、數量、小計  
4. **物流**：方式、單號、物流狀態、出貨時間  
5. **付款**：方式、付款狀態、付款時間  

---

## 待與後端確認

- [ ] 列表 API 買家篩選參數（BuyerID / Email / Token？）
- [ ] 買家是否可 PATCH 取消訂單、允許哪些狀態
- [ ] GET `/:OrderID` 回傳 JSON 結構範例
- [ ] Product 是否已嵌在 Orderdetail 或需前端再查
