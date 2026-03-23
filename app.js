const express = require('express')
const cors = require('cors')
require('dotenv').config()
const sequelize = require('./config/database')

const app = express()
console.log('目前 FORCE_MOCK 的值是:', process.env.FORCE_MOCK);
app.use(cors())
app.use(express.json())
// 設定靜態檔案資料夾，這樣連上網址才能看到前端網頁
app.use(express.static('public'));


// 1. 路由引入
const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/product')
const storeRoutes = require('./routes/store')
const orderRoutes = require('./routes/order')
const adminRoutes = require('./routes/adminRoutes')

// 2. 路由掛載
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/admin', adminRoutes)

// 3. 健康檢查 (放在這裡確保 API 層級沒問題)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: process.env.FORCE_MOCK === 'true' ? 'Mocking' : 'Database' 
  })
})

// 4. 資料庫連線邏輯 (優化：Mock 開啟時只顯示提示，不報錯)
if (process.env.FORCE_MOCK === 'true') {
  console.log('🧪 Mode: FORCE_MOCK is ON. Skipping DB connection check.')
} else {
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connection established')
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err.message)
      console.log('⚠️ 請檢查 .env 設定或 VPN 連線')
    })
}

// 5. 啟動伺服器
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`)
  console.log(`🔗 Health check: http://localhost:${port}/health`)
  console.log(`📦 Products API: http://localhost:${port}/api/products`)
})
