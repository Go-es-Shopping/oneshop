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
  // --- 日期欄位修正：讓資料庫 DEFAULT GETDATE() 接管 ---
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'CreatedAt'
  }
}, {
  tableName: 'PlatformAdmin',
  timestamps: false 
});

module.exports = PlatformAdmin;