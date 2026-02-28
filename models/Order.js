const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Order = sequelize.define('Order', {
  OrderID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  SellerID: { type: DataTypes.INTEGER, allowNull: false },
  BuyerName: { type: DataTypes.STRING(100), allowNull: false },
  BuyerPhone: { type: DataTypes.STRING(20), allowNull: false },
  BuyerEmail: { type: DataTypes.STRING(255), allowNull: false },
  BuyerAddress: { type: DataTypes.STRING(300), allowNull: false },
  OrderStatus: { type: DataTypes.STRING(30), allowNull: false },
  TotalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  PaymentStatus: { type: DataTypes.INTEGER, allowNull: false },
  CreatedAt: { type: DataTypes.DATE, allowNull: false },
  UpdatedAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'Order', timestamps: false })

module.exports = Order
