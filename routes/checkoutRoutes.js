const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// 購物車金額計算 API
router.post('/calculate', checkoutController.calculate);

module.exports = router;
