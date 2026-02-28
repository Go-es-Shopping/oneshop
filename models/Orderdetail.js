const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Orderdetail = sequelize.define('Orderdetail', {
  OrderdetailID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  OrderID: { type: DataTypes.INTEGER, allowNull: false },
  ProductID: { type: DataTypes.INTEGER, allowNull: false },
  Quantity: { type: DataTypes.INTEGER, allowNull: false },
  UnitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
}, { tableName: 'Orderdetail', timestamps: false })

module.exports = Orderdetail
