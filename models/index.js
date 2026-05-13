const sequelize = require('../config/database')
const Seller = require('./Seller')
const StorePage = require('./StorePage')
const PageContent = require('./PageContent')
const PageProduct = require('./PageProduct')
const Product = require('./Product')
const Order = require('./Order')
const Orderdetail = require('./Orderdetail')
const Payment = require('./Payment')
const Shipment = require('./Shipment')
const PlatformAdmin = require('./PlatformAdmin')
const PageVisit = require('./PageVisit')

// --- 1. 賣家相關核心關聯 ---
// 賣家與店鋪頁面：一個賣家可以擁有多個店鋪頁面 (如首頁、關於我)
Seller.hasMany(StorePage, { foreignKey: 'SellerID' })
StorePage.belongsTo(Seller, { foreignKey: 'SellerID' })

// 賣家與商品：一個賣家可以上架多個商品
Seller.hasMany(Product, { foreignKey: 'SellerID' })
Product.belongsTo(Seller, { foreignKey: 'SellerID' })

// 🚀 [新增] 賣家與瀏覽紀錄：讓賣家能追蹤自己賣場的流量數據 (用於 AI 分析基礎)
Seller.hasMany(PageVisit, { foreignKey: 'SellerID' })
PageVisit.belongsTo(Seller, { foreignKey: 'SellerID' })

// --- 2. 頁面與內容管理 (I18n 多國語言架構) ---
// 頁面與頁面內容：一個頁面可以有多種語言版本的描述
StorePage.hasMany(PageContent, { foreignKey: 'PageID', as: 'PageContent' });
PageContent.belongsTo(StorePage, { foreignKey: 'PageID' })

// 商品與頁面內容：商品描述同樣支援多國語言映射
Product.hasMany(PageContent, { foreignKey: 'ProductID' })
PageContent.belongsTo(Product, { foreignKey: 'ProductID' })

// --- 3. 頁面與商品組合邏輯 ---
StorePage.hasMany(PageProduct, { foreignKey: 'PageID' })
PageProduct.belongsTo(StorePage, { foreignKey: 'PageID' })

Product.hasOne(PageProduct, { foreignKey: 'ProductID' })
PageProduct.belongsTo(Product, { foreignKey: 'ProductID' })

// --- 4. 交易與訂單核心邏輯 ---
// 賣家與訂單：賣家管理屬於自己的訂單
Seller.hasMany(Order, { foreignKey: 'SellerID' })
Order.belongsTo(Seller, { foreignKey: 'SellerID' })

// 訂單與明細：一筆訂單包含多個商品項 (使用 as: 'Items' 符合前端 API 慣例)
Order.hasMany(Orderdetail, { foreignKey: 'OrderID', as: 'Items' })
Orderdetail.belongsTo(Order, { foreignKey: 'OrderID' })

// 明細與商品資訊：方便從訂單直接抓取商品圖片、價格
Product.hasMany(Orderdetail, { foreignKey: 'ProductID' })
Orderdetail.belongsTo(Product, { foreignKey: 'ProductID', as: 'Product' })

// 訂單與金流、物流
Order.hasOne(Shipment, { foreignKey: 'OrderID' })
Shipment.belongsTo(Order, { foreignKey: 'OrderID' })

Order.hasOne(Payment, { foreignKey: 'OrderID' })
Payment.belongsTo(Order, { foreignKey: 'OrderID' })

// --- 5. 數據追蹤與轉換分析 (未來 AI 功能核心) ---
// 商品與瀏覽紀錄：追蹤哪個商品被點擊最多次
Product.hasMany(PageVisit, { foreignKey: 'ProductID' })
PageVisit.belongsTo(Product, { foreignKey: 'ProductID' })

// 瀏覽紀錄與訂單：透過 SessionID 追蹤從「瀏覽」到「轉單」的完整路徑
// 注意：此處關閉資料庫強約束以優化寫入效能，改由應用層邏輯控制
PageVisit.hasMany(Order, { foreignKey: 'SessionID', sourceKey: 'SessionID', constraints: false })
Order.belongsTo(PageVisit, { foreignKey: 'SessionID', targetKey: 'SessionID', constraints: false })

const db = {
  sequelize,
  Seller,
  StorePage,
  PageContent,
  PageProduct,
  Product,
  Order,
  Orderdetail,
  OrderDetail: Orderdetail,
  Payment,
  Shipment,
  PlatformAdmin,
  PageVisit
}

module.exports = db
