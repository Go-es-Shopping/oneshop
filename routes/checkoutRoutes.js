const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// 1. 購物車金額計算 API
router.post('/calculate', checkoutController.calculate);

// 2. 結帳並建立訂單 API (POST /api/checkout 或對應的路徑)
router.post('/', checkoutController.checkout);

module.exports = router;
