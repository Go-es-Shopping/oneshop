const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlatformAdmin = sequelize.define('PlatformAdmin', {
  // 管理員 ID，對應 SQL Server 的 Identity
  AdminID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'AdminID'
  },
  // 管理員名稱，使用 WSTRING 支援 nvarchar 中文名
  AdminName: {
    type: DataTypes.WSTRING(100),
    allowNull: false,
    field: 'AdminName'
  },
  // 電子郵件
  Email: {
    type: DataTypes.WSTRING(255),
    allowNull: false,
    unique: true, // 管理員信箱通常不可重複
    field: 'Email'
  },
  // 密碼雜湊值
  PasswordHash: {
    type: DataTypes.WSTRING(255),
    allowNull: false,
    field: 'PasswordHash'
  },
  // 角色權限 (如：超級管理員、客服)，支援中文
  Role: {
    type: DataTypes.WSTRING(50),
    allowNull: false,
    field: 'Role'
  },
  // --- 日期雙重保險開始 ---
  // 對應 DB 的 CreatedAt 與 (getdate()) 預設值
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // 程式層級保險
    field: 'CreatedAt'
  }
}, {
  tableName: 'PlatformAdmin',
  // 注意：這張表 DB 裡只有 CreatedAt 欄位，沒有 UpdatedAt，
  // 所以我們設 timestamps: false，避免 Sequelize 自動去找 UpdatedAt 欄位。
  timestamps: false 
});

module.exports = PlatformAdmin;