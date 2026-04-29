require('dotenv').config();
const sequelize = require('./config/database');
const {
  PlatformAdmin,
  Seller,
  StorePage,
  PageContent,
  Product,
  PageProduct,
  Order,
  Orderdetail,
  Payment,
  Shipment,
  PageVisit,
} = require('./models');

async function seed() {
  try {
    console.log('🚀 開始連線資料庫...');
    await sequelize.authenticate();
    console.log('✅ 資料庫連線成功。');

    // --- 關鍵修復：針對「藏起來」的 Notification 表進行資料清理 ---
console.log('🧹 處理隱藏的 Notification 資料關聯...');
try {
    // 這一行只會清空裡面的「資料」，絕對不會刪除你的「表格結構」！
    await sequelize.query('DELETE FROM [Notification]'); 
    console.log('✅ Notification 資料清理完成（結構仍保留）。');
} catch (e) {
    // 如果表格真的不存在，就直接跳過，不會當機
    console.log('ℹ️ 跳過 Notification 清理（表格可能尚未建立或已手動處理）。');
}

    // 1. 自動清理 (依序刪除，避免外鍵衝突)
    console.log('🧹 正在清空舊資料...');
    await Orderdetail.destroy({ where: {}, truncate: false });
    await Payment.destroy({ where: {}, truncate: false });
    await Shipment.destroy({ where: {}, truncate: false });
    await Order.destroy({ where: {}, truncate: false });
    await PageProduct.destroy({ where: {}, truncate: false });
    await PageContent.destroy({ where: {}, truncate: false });
    await Product.destroy({ where: {}, truncate: false });
    await StorePage.destroy({ where: {}, truncate: false });
    await Seller.destroy({ where: {}, truncate: false });
    await PlatformAdmin.destroy({ where: {}, truncate: false });
    console.log('✅ 舊資料清理完成。');

    // 2. 同步模型結構 (force: false 不會刪除現有 Table)
    await sequelize.sync({ force: false });

    // 3. 灌入測試資料 (僅保留業務資料，完全移除日期欄位)
    console.log('🌱 正在灌入測試資料...');

    // PlatformAdmin
    const admin = await PlatformAdmin.create({
      AdminName: '系統管理員',
      Email: 'admin@oneshop.tw',
      PasswordHash: 'hashed_password_here',
      Role: '0',
      CreatedAt: sequelize.literal('GETDATE()')
    });

    // Seller
    const seller = await Seller.create({
      SellerName: '測試賣家A',
      StoreName: '阿米一頁購',
      Email: 'seller@test.com',
      //  這一串就是 "123456" 的 Bcrypt 加密結果
      PasswordHash: '$2b$10$92IXMTstB5S6uL7mCTYzS.Ew53sSL.77V.9KInw9N/m.N.7uE.Ega',
      Phone: '+886912345678',
      PlanType: '1',
      Status: 1,
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    });

    // StorePage
    const page = await StorePage.create({
      SellerID: seller.SellerID,
      TemplateName: 'OnePageV1',
      IsPublished: true,
      PageUrl: 'acme-special',
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    });

    // Product
    const product1 = await Product.create({
      SellerID: seller.SellerID,
      ProductImg: 'https://images.pexels.com/photos/36726312/pexels-photo-36726312.jpeg',
      Price: 590.00,
      Stock: 50,
      IsActive: true,
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    });

    const product2 = await Product.create({
      SellerID: seller.SellerID,
      ProductImg: 'https://images.pexels.com/photos/8222218/pexels-photo-8222218.jpeg',
      Price: 990.00,
      Stock: 20,
      IsActive: true,
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    });

    // PageContent
    await PageContent.bulkCreate([
      {
      PageID: page.PageID,
      ProductID: product1.ProductID,
      LanguageCode: 'zh-TW',
      PageTitle: '小小復古選物天堂',
      PageDescription: '找到屬於你的質感小物',
      ProductName: '金屬花花戒指',
      ProductDescription: '紅色小花，綻放在金黃色暖陽',
      CTA_Text: '立即購買',
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    },
    {
    PageID: page.PageID,
    ProductID: product2.ProductID,
    LanguageCode: 'zh-TW',
    PageTitle: '小小復古選物天堂',
    PageDescription: '找到屬於你的可愛小物',
    ProductName: '鏤空花語小夜燈',
    ProductDescription: '簡約小花設計，微光暖暖透出，伴你放鬆入眠。',
    CTA_Text: '立即購買',
    CreatedAt: sequelize.literal('GETDATE()'),
    UpdatedAt: sequelize.literal('GETDATE()')
  }
    ]);

    // PageProduct
    await PageProduct.create({
      PageID: page.PageID,
      ProductID: product1.ProductID,
      DisplayOrder: 1,
      isFeatured: 1,
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    });

    await PageProduct.create({
      PageID: page.PageID,
      ProductID: product2.ProductID,
      DisplayOrder: 2,
      isFeatured: 0,
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    });
    console.log('📈 正在產生 PageVisit 流量數據...');
//PageVisit
console.log('📈 正在產生 PageVisit 具備 AI 洞察的流量數據...');

// 第一筆：來自 FB 廣告的高意圖購買者 (手機用戶)
await PageVisit.create({
  ProductID: product1.ProductID,
  SellerID: seller.SellerID,
  PageType: 'Product',
  Referrer: 'https://m.facebook.com/ads',
  IPAddress: '114.32.10.5',
  UserAgent: 'iPhone / Safari',
  SessionID: 'sess_abc123',
  // 🚀 AI 擴充欄位展示：分析出高購買意圖
  Metadata: JSON.stringify({ 
    utm_source: 'fb_campaign_summer', 
    device: 'Mobile', 
    stay_duration: '120s',
    ai_insights: {
      intent_score: 0.92,
      user_segment: '高潛力買家',
      suggested_action: '發送限時折扣券'
    }
  }),
  CreatedAt: sequelize.literal('GETDATE()')
});

// 第二筆：來自 Google 搜尋的探索型用戶 (電腦用戶)
await PageVisit.create({
  ProductID: product1.ProductID,
  SellerID: seller.SellerID,
  PageType: 'Product',
  Referrer: 'https://www.google.com.tw',
  IPAddress: '192.168.1.100',
  UserAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
  SessionID: 'sess_xyz789',
  // 🚀 AI 擴充欄位展示：分析出一般興趣
  Metadata: JSON.stringify({ 
    utm_source: 'organic_search', 
    device: 'Desktop', 
    stay_duration: '15s',
    ai_insights: {
      intent_score: 0.35,
      user_segment: '一般訪客',
      suggested_action: '展示熱門商品推薦'
    }
  }),
  CreatedAt: sequelize.literal('GETDATE()')
});

    // Order 1: 未支付
    const order1 = await Order.create({
      SellerID: seller.SellerID,
      BuyerName: '王小明',
      BuyerPhone: '+886988777666',
      BuyerEmail: 'buyer@example.com',
      BuyerAddress: '台北市信義區忠孝東路五段',
      OrderStatus: '0', // 待處理
      TotalAmount: 1990.00,
      PaymentStatus: 0, // 未支付
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    });

    // Orderdetail 1
    await Orderdetail.create({
      OrderID: order1.OrderID,
      ProductID: product1.ProductID,
      Quantity: 1,
      UnitPrice: 1990.00
    });

    // Payment 1
    await Payment.create({
      OrderID: order1.OrderID,
      PaymentMethod: 'CreditCard',
      PaymentStatus: '0', // 待支付
      PaidAt: null 
    });

    // Shipment 1
    await Shipment.create({
      OrderID: order1.OrderID,
      ShippingMethod: '7-11',
      TrackingNumber: 'TW123456789',
      ShipmentStatus: '0', // 待出貨
      ShippedAt: null
    });

    // Order 2: 已完成
    const order2 = await Order.create({
      SellerID: seller.SellerID,
      BuyerName: '李小華',
      BuyerPhone: '+886911222333',
      BuyerEmail: 'hua@example.com',
      BuyerAddress: '台中市西屯區台灣大道',
      OrderStatus: '2', // 已完成
      TotalAmount: 599.00,
      PaymentStatus: 1, // 已支付
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    });

    // Orderdetail 2
    await Orderdetail.create({
      OrderID: order2.OrderID,
      ProductID: product2.ProductID,
      Quantity: 1,
      UnitPrice: 599.00
    });

    // Payment 2
    await Payment.create({
      OrderID: order2.OrderID,
      PaymentMethod: 'LinePay',
      PaymentStatus: '1', // 已支付
      PaidAt: sequelize.literal('GETDATE()')
    });

    // Shipment 2
    await Shipment.create({
      OrderID: order2.OrderID,
      ShippingMethod: 'Home',
      TrackingNumber: 'H987654321',
      ShipmentStatus: '2', // 已送達
      ShippedAt: sequelize.literal('GETDATE()')
    });

    console.log('✅ 所有測試資料已成功灌入！');
  } catch (error) {
    console.error('❌ Seed 過程中發生錯誤:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

seed();
