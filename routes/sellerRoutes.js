// 模組對應資料表：Seller (賣家身份驗證與個人資料路由)
const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

// 定義賣家相關路由
router.post('/login', sellerController.login);// 賣家登入路由
router.get('/me', sellerController.getProfile);// 取得賣家個人資料路由
router.post('/register', sellerController.register); // 賣家註冊路由
router.post('/logout', sellerController.logout);// 賣家登出路由

module.exports = router;
