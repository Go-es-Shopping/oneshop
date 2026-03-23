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
  // 管理員真實姓名，使用 STRING 支援 nvarchar
  AdminName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'AdminName'
  },
  // 信箱
  Email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'Email'
  },
  // 經過雜湊處理的密碼
  PasswordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'PasswordHash'
  },
  // 角色權限 (如：Admin, CustomerService)，使用 STRING 支援 nvarchar
  Role: {
    type: DataTypes.STRING(50),
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