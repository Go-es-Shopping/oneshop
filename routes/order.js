const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')
const orderController = require('../controllers/orderController');
const router = express.Router()

// 判斷是否使用 Mock 的機制
async function useMock() {
  if (process.env.FORCE_MOCK === 'true') return true
  try {
    await sequelize.authenticate()
    return false
  } catch {
    return true
  }
}

// 1. 建立訂單 (POST /)
router.post('/', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const { items, ShippingMethod } = req.body;
    
    // --- 模擬 Controller 的防禦性算錢邏輯 ---
    let subTotal = 0;
    const mockPrice = 500; // 模擬資料庫中商品的固定單價

    if (items && items.length > 0) {
      items.forEach(item => {
        subTotal += mockPrice * item.Quantity;
      });
    }

    // --- 模擬運費邏輯 (宅配+100, 超取+60, 滿千免運) ---
    let shippingFee = (ShippingMethod === '宅配') ? 100 : 60;
    if (subTotal >= 1000) shippingFee = 0;
    
    const totalAmount = subTotal + shippingFee;

    // 印在終端機讓你自己檢查
    console.log('--- [Mock 模式] 金額計算中 ---');
    console.log('商品小計:', subTotal);
    console.log('運費:', shippingFee);
    console.log('應付總額:', totalAmount);
    console.log('----------------------------');

    return res.status(201).json({
      Success: true,
      OrderID: 70001,
      SubTotal: subTotal,
      ShippingFee: shippingFee,
      TotalAmount: totalAmount,
      Message: "模擬下單成功 (資料庫未連線)"
    });
  }
  return orderController.createOrder(req, res);
});

// 2. 查詢單筆訂單詳情 (GET /:OrderID)
router.get('/:OrderID', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const base = readMock('order.json').detail
    return res.json({ ...base, OrderID: req.params.OrderID });
  }
  return orderController.getOrderDetail(req, res);
});

// 3. 查詢訂單列表 (GET /)
router.get('/', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    return res.json(readMock('order.json').list);
  }
  return orderController.getSellerOrders(req, res);
});

// 4. 更新訂單狀態 (PATCH /:OrderID/status)
router.patch('/:OrderID/status', orderController.updateStatus);

// 5. 任務：關鍵例外處理 (PATCH /:OrderID/cancel)
// 組長特別提到的 API，我們將它導向 updateStatus，但在 Body 強制設定 OrderStatus 為 9
router.patch('/:OrderID/cancel', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    // 模擬從「這筆訂單」裡抓到的商品與數量
    const mockOrderItems = [
      { ProductID: 1, Quantity: 2, ProductName: "模擬商品A" }
    ];

    console.log(`--- [Mock 模式] 執行庫存回補 ---`);
    mockOrderItems.forEach(item => {
      console.log(`[回補成功] 商品: ${item.ProductName}, 數量: +${item.Quantity}`);
    });
    console.log(`--- 訂單 ${req.params.OrderID} 已標記為取消 ---`);

    return res.json({
      Success: true,
      OrderID: req.params.OrderID,
      NewStatus: 9,
      RecoveredItems: mockOrderItems,
      Message: "模擬庫存回補成功"
    });
  }
  
  // 若非 Mock 模式，則呼叫 Controller 執行真資料庫操作
  req.body.OrderStatus = 9; 
  return orderController.updateStatus(req, res);
});


module.exports = router; // 只導出 Router
