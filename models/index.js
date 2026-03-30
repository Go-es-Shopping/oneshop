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

Seller.hasMany(StorePage, { foreignKey: 'SellerID' })
StorePage.belongsTo(Seller, { foreignKey: 'SellerID' })

Seller.hasMany(Product, { foreignKey: 'SellerID' })
Product.belongsTo(Seller, { foreignKey: 'SellerID' })

StorePage.hasMany(PageProduct, { foreignKey: 'PageID' })
PageProduct.belongsTo(StorePage, { foreignKey: 'PageID' })

Product.hasOne(PageProduct, { foreignKey: 'ProductID' })
PageProduct.belongsTo(Product, { foreignKey: 'ProductID' })

StorePage.hasMany(PageContent, { foreignKey: 'PageID' })
PageContent.belongsTo(StorePage, { foreignKey: 'PageID' })

Product.hasMany(PageContent, { foreignKey: 'ProductID' })
PageContent.belongsTo(Product, { foreignKey: 'ProductID' })

Seller.hasMany(Order, { foreignKey: 'SellerID' })
Order.belongsTo(Seller, { foreignKey: 'SellerID' })

// --- 修改這部分 ---
// 1. 讓訂單可以透過 .Items 抓到明細 (對應規格書 Items 欄位)
Order.hasMany(Orderdetail, { foreignKey: 'OrderID', as: 'Items' })
Orderdetail.belongsTo(Order, { foreignKey: 'OrderID' })

// 2. 讓明細可以抓到商品資訊 (選用，方便後續查詢)
Product.hasMany(Orderdetail, { foreignKey: 'ProductID' })
Orderdetail.belongsTo(Product, { foreignKey: 'ProductID', as: 'Product' })
// -----------------

Order.hasOne(Shipment, { foreignKey: 'OrderID' })
Shipment.belongsTo(Order, { foreignKey: 'OrderID' })

Order.hasOne(Payment, { foreignKey: 'OrderID' })
Payment.belongsTo(Order, { foreignKey: 'OrderID' })

// 建立 PageVisit 與 Order 的關聯 (透過 SessionID)
// 這樣未來可以透過 SessionID 追蹤從瀏覽到下單的完整路徑
// 注意：為了避免 MSSQL 因為 SessionID 不是 Unique Key 而報錯，我們關閉資料庫層級的 Foreign Key 約束
PageVisit.hasMany(Order, { foreignKey: 'SessionID', sourceKey: 'SessionID', constraints: false })
Order.belongsTo(PageVisit, { foreignKey: 'SessionID', targetKey: 'SessionID', constraints: false })

module.exports = {
  Seller,
  StorePage,
  PageContent,
  PageProduct,
  Product,
  Order,
  Orderdetail,
  Payment,
  Shipment,
  PlatformAdmin,
  PageVisit
}
