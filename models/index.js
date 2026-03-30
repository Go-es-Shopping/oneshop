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

Order.hasMany(Orderdetail, { foreignKey: 'OrderID' })
Orderdetail.belongsTo(Order, { foreignKey: 'OrderID' })

Product.hasMany(Orderdetail, { foreignKey: 'ProductID' })
Orderdetail.belongsTo(Product, { foreignKey: 'ProductID' })

Order.hasOne(Shipment, { foreignKey: 'OrderID' })
Shipment.belongsTo(Order, { foreignKey: 'OrderID' })

Order.hasOne(Payment, { foreignKey: 'OrderID' })
Payment.belongsTo(Order, { foreignKey: 'OrderID' })

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
