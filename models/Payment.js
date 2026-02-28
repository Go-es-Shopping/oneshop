const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Payment = sequelize.define('Payment', {
  PaymentID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  OrderID: { type: DataTypes.INTEGER, allowNull: false },
  PaymentMethod: { type: DataTypes.STRING(50), allowNull: false },
  PaymentStatus: { type: DataTypes.STRING(50), allowNull: false },
  PaidAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'Payment', timestamps: false })

module.exports = Payment
