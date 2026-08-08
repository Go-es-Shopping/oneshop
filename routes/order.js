const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')
// 統一使用 orderController（請確保你的控制器檔案名稱是否為 orderController.js）
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
  return orderController.createOrder(req, res);
});

// 2. 查詢訂單列表 (GET /all 與 GET /)
function handleOrderList(mock, req, res) {
  if (mock) {
    const list = readMock('order.json').list || [];
    const status = req.query.OrderStatus;
    const filtered = status && status !== '' ? list.filter(o => String(o.OrderStatus) === String(status)) : list;
    return res.json(filtered);
  }
  return orderController.getSellerOrders(req, res);
}

router.get('/all', async (req, res) => {
  handleOrderList(await useMock(), req, res);
});

router.get('/', async (req, res) => {
  handleOrderList(await useMock(), req, res);
});

// 3. 查詢訂單明細列表 (GET /:OrderID/details)
router.get('/:OrderID/details', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const mockData = readMock('order.json');
    const details = (mockData.detail && mockData.detail.Orderdetails) ? mockData.detail.Orderdetails : [];
    const orderId = req.params.OrderID;
    const mapped = details.map(d => ({ ...d, OrderID: d.OrderID || orderId }));
    return res.json(mapped);
  }
  return orderController.getOrderDetailsList ? orderController.getOrderDetailsList(req, res) : res.status(501).json({ message: "Not implemented" });
});

// 4. 更新訂單狀態 (PATCH /:OrderID/status, PUT /:OrderID/status)
async function handleUpdateStatus(req, res) {
  const mock = await useMock()
  if (mock) {
    return res.json({ Success: true, Message: 'Mock 更新狀態成功' });
  }
  return orderController.updateStatus(req, res);
}
router.patch('/:OrderID/status', handleUpdateStatus);
router.put('/:OrderID/status', handleUpdateStatus);

// 5. 查詢單筆訂單詳情 (GET /:OrderID)
router.get('/:OrderID', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const base = readMock('order.json').detail
    return res.json({ ...base, OrderID: req.params.OrderID });
  }
  return orderController.getOrderDetail(req, res);
});

// 6. 刪除指定訂單 (DELETE /:OrderID)
router.delete('/:OrderID', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    return res.json({ Success: true, Message: 'Mock 刪除成功' });
  }
  return orderController.deleteOrder(req, res);
});

module.exports = router;
