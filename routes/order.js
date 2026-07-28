const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')
const sellerOrderController = require('../controllers/sellerOrderController');
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

// 1. 建立訂單 (POST /) -> 如果這條學姊沒用到可以保留或維持不動
router.post('/', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const base = readMock('order.json').created
    return res.status(201).json({ ...base, OrderID: 70001 })
  }
  // 如果需要，也可以對應到對應的 Controller
  return res.status(200).json({ message: "ok" });
});

// 2. 查詢單筆訂單詳情 (GET /:OrderID)
router.get('/:OrderID', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const base = readMock('order.json').detail
    return res.json({ ...base, OrderID: req.params.OrderID });
  }
  // 🌟 呼叫你的 Controller 抓取真實明細
  return sellerOrderController.getOrderDetail(req, res);
});

// 3. 查詢訂單列表 (GET /) -> 🌟 這是你賣家後台主要用到的地方！
router.get('/', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    return res.json(readMock('order.json').list);
  }
  // 呼叫你的專屬 Controller，從資料庫抓取賣家的訂單清單
  return sellerOrderController.getSellerOrders(req, res);
});
// 刪除指定訂單 (DELETE /:OrderID)
router.delete('/:OrderID', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    return res.json({ Success: true, Message: 'Mock 刪除成功' });
  }
  return sellerOrderController.deleteOrder(req, res);
});
module.exports = router;