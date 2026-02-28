const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const PageProduct = sequelize.define('PageProduct', {
  PageProductID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  PageID: { type: DataTypes.INTEGER, allowNull: false },
  ProductID: { type: DataTypes.INTEGER, allowNull: false },
  DisplayOrder: { type: DataTypes.INTEGER, allowNull: false },
  isFeatured: { type: DataTypes.BOOLEAN, allowNull: false },
  CreatedAt: { type: DataTypes.DATE, allowNull: false },
  UpdatedAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'PageProduct', timestamps: false })

module.exports = PageProduct
