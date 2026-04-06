require('dotenv').config()
const express = require('express')
const cors = require('cors')

// --- 全域錯誤監控 ---
// 放在最頂端，確保能捕捉到所有階段的錯誤
process.on('uncaughtException', (err) => { 
  console.error('🔴 捕捉到未處理錯誤 (uncaughtException):', err); 
}); 
process.on('unhandledRejection', (reason, promise) => { 
  console.error('🔴 捕捉到未處理拒絕 (unhandledRejection):', reason); 
});

process.on('exit', (code) => {
  console.log(`ℹ️ 進程即將結束，結束碼 (Exit Code): ${code}`);
});

// 強制懸掛 (Keep-Alive)：確保 Event Loop 始終有 handle，防止進程因排空而自動結束
// 放在這裡可以確保即使 startServer 尚未完成或失敗，進程也不會立即消失
const keepAlive = setInterval(() => {
  // 僅作為維持進程用途
}, 1000 * 60 * 60);

process.on('SIGINT', () => {
  console.log('ℹ️ 接收到 SIGINT (Ctrl+C)，正在關閉伺服器...');
  clearInterval(keepAlive);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('ℹ️ 接收到 SIGTERM，正在關閉伺服器...');
  clearInterval(keepAlive);
  process.exit(0);
});

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
const checkoutRoutes = require('./routes/checkoutRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')

// 2. 路由掛載
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/admin', adminRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/track', analyticsRoutes)

// 3. 健康檢查 (放在這裡確保 API 層級沒問題)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: process.env.FORCE_MOCK === 'true' ? 'Mocking' : 'Database' 
  })
})

// 4. 初始化函數 (整合 DB 與 Server 啟動)
const startServer = async () => {
  try {
    console.log('🔄 Starting initialization...');
    
    // 資料庫連線邏輯
    if (process.env.FORCE_MOCK === 'true') {
      console.log('🧪 Mode: FORCE_MOCK is ON. Skipping DB connection check.')
    } else {
      await sequelize.authenticate();
      console.log('✅ Database connection established');
    }

    // 啟動伺服器
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    
    // 檢查 port 是否有效
    if (isNaN(port)) {
      throw new Error(`Invalid PORT value: ${process.env.PORT}`);
    }

    const server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
      console.log(`📦 Products API: http://localhost:${port}/api/products`);
    });

    server.on('error', (err) => {
      console.error('🔴 Server Error Event Triggered:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use by another process.`);
        console.log('💡 建議：請先關閉舊的 Node 進程，或在 .env 修改 PORT');
      }
    });

  } catch (err) {
    console.error('❌ startServer 過程中發生嚴重錯誤:');
    console.error(err);
    console.log('⚠️ 伺服器啟動中斷。由於有 keep-alive，進程將保持掛起以便您排錯。');
  }
};

startServer();

