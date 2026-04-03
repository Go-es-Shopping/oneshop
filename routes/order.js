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
    const base = readMock('order.json').created
    return res.status(201).json({ ...base, OrderID: 70001 })
  }
  // 呼叫大腦：執行實際的建立與扣庫存邏輯
  return orderController.createOrder(req, res);
});

// 2. 查詢單筆訂單詳情 (GET /:OrderID)
router.get('/:OrderID', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const base = readMock('order.json').detail
    return res.json({ ...base, OrderID: req.params.OrderID });
  }
  // 呼叫大腦：執行資料庫 JOIN 查詢
  return orderController.getOrderDetail(req, res);
});

// 3. 查詢訂單列表 (GET /)
router.get('/', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    return res.json(readMock('order.json').list);
  }
  // 呼叫大腦：從資料庫抓取賣家的訂單清單
  return orderController.getSellerOrders(req, res);
});

// 4. 更新訂單狀態 (PATCH /:id/status)
router.patch('/:id/status', orderController.updateStatus);

// 5. 結帳 (POST /checkout)
router.post('/checkout', orderController.createOrder);

module.exports = router;