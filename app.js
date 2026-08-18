require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path') 
const fs = require('fs')     
const multer = require('multer') 

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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 🚀 新增：Multer 圖片上傳設定 ---
// 確保目錄存在：public/images/logos
const uploadDir = path.join(__dirname, 'public/images/logos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// 📦 【Backend Lead 擴充】：確保商品圖片目錄存在
const productUploadDir = path.join(__dirname, 'public/images/products');
if (!fs.existsSync(productUploadDir)) {
    fs.mkdirSync(productUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/logos'); // 存到你指定的資料夾
    },
    filename: (req, file, cb) => {
        // 檔名：logo-時間戳記-隨機數.副檔名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 限制 5MB
});
// 📦 【Backend Lead 擴充】：商品圖片的獨立儲存引擎
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/products'); // 丟到專屬的 products 資料夾
    },
    filename: (req, file, cb) => {
        // 檔名：product-時間戳記-隨機數.副檔名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadProduct = multer({ 
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 限制 5MB，對電商圖片來說非常夠用
});


// 1. 路由引入
const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/product')
const storeRoutes = require('./routes/store')
const orderRouter = require('./routes/order')
const adminRoutes = require('./routes/adminRoutes')
const checkoutRoutes = require('./routes/checkoutRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')
const couponRoutes = require('./routes/couponRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use(cors());
app.use(express.json());
// 設定靜態檔案資料夾，這樣連上網址才能看到前端網頁
app.use(express.static('public'));

// 2. 路由掛載
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/orders', orderRouter)
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/admin', adminRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/track', analyticsRoutes)
// 掛載優惠券路由
app.use('/api/coupons', couponRoutes);
app.use('/api/payment', paymentRoutes);

// --- 🚀 新增：處理前台專屬網址動態路由 (/store/:slug)，可以正確對應到你的前台樣板頁面 ---
app.get('/store/:slug', (req, res) => {
    // 讓伺服器回傳你的前台樣板檔案 (請確認你的前台消費者樣板檔名是否為 goez-store-template.html)
    res.sendFile(path.join(__dirname, 'public', 'goez-store-template.html'));
});

app.use('/api/ai', aiRoutes);


// --- 🚀 新增：商標圖片上傳 API 路由 ---
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: '未選擇檔案' });
        // 生成給前端用的網址 (不含 public)
        const logoUrl = `/images/logos/${req.file.filename}`;
        res.json({ success: true, url: logoUrl });
    } catch (err) {
        console.error("上傳失敗:", err);
        res.status(500).json({ success: false, message: '伺服器上傳錯誤' });
    }
});

//  【商品圖片上傳 API 路由擴充】
// 這裡前端上傳時的 input 欄位 name 要叫做 'product_file'
app.post('/api/upload-product-img', uploadProduct.single('product_file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: '未選擇檔案' });
        
        // 生成給前端用的虛擬網址 (上市平台標準：隱藏後端真實路徑 public)
        const productImgUrl = `/images/products/${req.file.filename}`;
        
        console.log(`[System] 商品圖片背景上傳成功，暫存路徑為: ${productImgUrl}`);
        return res.json({ success: true, url: productImgUrl });
    } catch (err) {
        console.error("商品圖片上傳失敗:", err);
        return res.status(500).json({ success: false, message: '伺服器上傳錯誤' });
    }
});

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

