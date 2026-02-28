const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const PlatformAdmin = sequelize.define('PlatformAdmin', {
  AdminID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  AdminName: { type: DataTypes.STRING(100), allowNull: false },
  Email: { type: DataTypes.STRING(255), allowNull: false },
  PasswordHash: { type: DataTypes.STRING(255), allowNull: false },
  Role: { type: DataTypes.STRING(50), allowNull: false },
  CreatedAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'PlatformAdmin', timestamps: false })

module.exports = PlatformAdmin
