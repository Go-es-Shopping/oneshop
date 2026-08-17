// 模組對應資料表：Seller (賣家身份驗證與個人資料路由)
const express = require('express')
const router = express.Router()

// 💡 引入剛剛寫好的 sellerController，把邏輯抽離統一管理
const sellerController = require('../controllers/sellerController')

// ==========================================
// 賣家身份驗證 API 路由
// ==========================================

// 1. 賣家註冊 API
router.post('/register', sellerController.register)

// 2. 賣家登入 API
router.post('/login', sellerController.login)

// 3. 取得賣家個人資料 API
router.get('/me', sellerController.getProfile)

// 4. 賣家登出 API
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: '登出成功' })
})

module.exports = router