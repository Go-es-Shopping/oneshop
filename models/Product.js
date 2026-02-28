const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Product = sequelize.define('Product', {
  ProductID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  SellerID: { type: DataTypes.INTEGER, allowNull: false },
  ProductImg: { type: DataTypes.TEXT, allowNull: false },
  Price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  Stock: { type: DataTypes.INTEGER, allowNull: false },
  IsActive: { type: DataTypes.BOOLEAN, allowNull: false },
  CreatedAt: { type: DataTypes.DATE, allowNull: false },
  UpdatedAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'Product', timestamps: false })

module.exports = Product
