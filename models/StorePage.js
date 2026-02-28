const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const StorePage = sequelize.define('StorePage', {
  PageID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  SellerID: { type: DataTypes.INTEGER, allowNull: false },
  TemplateName: { type: DataTypes.STRING(50), allowNull: false },
  IsPublished: { type: DataTypes.BOOLEAN, allowNull: false },
  PageUrl: { type: DataTypes.STRING(100), allowNull: false },
  CreatedAt: { type: DataTypes.DATE, allowNull: false },
  UpdatedAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'StorePage', timestamps: false })

module.exports = StorePage
