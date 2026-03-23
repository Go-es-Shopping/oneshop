const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

// 定義賣家相關路由
router.post('/login', sellerController.login);
router.get('/me', sellerController.getProfile);
// router.post('/register', sellerController.register); // 接下來可以寫這個

module.exports = router;
