const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Seller = sequelize.define('Seller', {
  SellerID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  SellerName: { type: DataTypes.STRING(100), allowNull: false },
  StoreName: { type: DataTypes.STRING(100), allowNull: false },
  Email: { type: DataTypes.STRING(255), allowNull: false },
  PasswordHash: { type: DataTypes.STRING(255), allowNull: false },
  Phone: { type: DataTypes.STRING(20), allowNull: false },
  CreatedAt: { type: DataTypes.DATE, allowNull: false },
  PlanType: { type: DataTypes.STRING(20), allowNull: false },
  Status: { type: DataTypes.INTEGER, allowNull: false },
  UpdatedAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'Seller', timestamps: false })

module.exports = Seller
