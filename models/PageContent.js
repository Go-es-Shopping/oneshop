const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const PageContent = sequelize.define('PageContent', {
  PageContentID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  PageID: { type: DataTypes.INTEGER, allowNull: false },
  ProductID: { type: DataTypes.INTEGER, allowNull: false },
  LanguageCode: { type: DataTypes.STRING(10), allowNull: false },
  PageTitle: { type: DataTypes.STRING(200), allowNull: true },
  PageDescription: { type: DataTypes.TEXT, allowNull: true },
  ProductName: { type: DataTypes.STRING(200), allowNull: false },
  ProductDescription: { type: DataTypes.TEXT, allowNull: true },
  CTA_Text: { type: DataTypes.STRING(100), allowNull: false },
  CreatedAt: { type: DataTypes.DATE, allowNull: false },
  UpdatedAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'PageContent', timestamps: false })

module.exports = PageContent
