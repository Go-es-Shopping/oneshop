const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seller = sequelize.define('Seller', {
  SellerID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'SellerID'
  },
  // 賣家真實姓名，使用 STRING 支援 nvarchar
  SellerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'SellerName'
  },
  // 店鋪名稱，使用 STRING 支援 nvarchar
  StoreName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'StoreName'
  },
  // 信箱
  Email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'Email'
  },
  // 經過雜湊處理的密碼
  PasswordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'PasswordHash'
  },
  // 連絡電話
  Phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'Phone'
  },
  // 方案類型 (如：Free, Advanced)，使用 STRING 支援 nvarchar
  PlanType: {
    type: DataTypes.STRING(20),
    allowNull: false,
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
