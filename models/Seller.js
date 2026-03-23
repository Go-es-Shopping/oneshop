const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seller = sequelize.define('Seller', {
  SellerID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'SellerID'
  },
  SellerName: {
    type: DataTypes.WSTRING(100),
    allowNull: false,
    field: 'SellerName'
  },
  StoreName: {
    type: DataTypes.WSTRING(100),
    allowNull: false,
    field: 'StoreName'
  },
  Email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'Email'
  },
  PasswordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'PasswordHash'
  },
  Phone: {
    type: DataTypes.STRING(20),
    field: 'Phone'
  },
  PlanType: {
    type: DataTypes.STRING(20),
    field: 'PlanType'
  },
  Status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'Status'
  },
  // --- 日期雙重保險開始 ---
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'UpdatedAt'
  }
}, {
  tableName: 'Seller',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

module.exports = Seller;
