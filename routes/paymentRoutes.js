const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 接收藍新背景通知 API (對應你在 tradeInfoObj 填入的 NotifyURL)
// 路由會是 /api/payment/notify
router.post('/notify', paymentController.notify);

module.exports = router;