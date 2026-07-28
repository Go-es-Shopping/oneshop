const express = require('express')
const cors = require('cors')
require('dotenv').config()
const sequelize = require('./config/database')

const app = express()
console.log('目前 FORCE_MOCK 的值是:', process.env.FORCE_MOCK);

// --- 🚀 新增：Multer 圖片上傳設定 ---
// 確保目錄存在：public/images/logos
const uploadDir = path.join(__dirname, 'public/images/logos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
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


// 1. 路由引入
const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/product')
const storeRoutes = require('./routes/store')
const orderRoutes = require('./routes/order')
const adminRoutes = require('./routes/adminRoutes')
const checkoutRoutes = require('./routes/checkoutRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')

app.use(cors());
app.use(express.json());
// 設定靜態檔案資料夾，這樣連上網址才能看到前端網頁
app.use(express.static('public'));

// 2. 路由掛載
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/orders', orderRoutes)
//app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/admin', adminRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/track', analyticsRoutes)


// --- 🚀 新增：圖片上傳 API 路由 ---
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
