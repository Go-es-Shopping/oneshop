const { DataTypes } = require('sequelize');
// 假設你的 sequelize 實例初始化在 config/database.js
const sequelize = require('../config/database'); 

const StorePage = sequelize.define('StorePage', {
  // 修正：必須加上 autoIncrement 對應資料庫的 Identity
  PageID: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, // 這對應 SQL Server 的 Identity
    primaryKey: true,
    field: 'PageID' // 顯式映射，確保萬無一失
  },
  SellerID: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    field: 'SellerID'
  },
  TemplateName: { 
    type: DataTypes.STRING(50), 
    allowNull: false,
    field: 'TemplateName'
  },
  IsPublished: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false,
    field: 'IsPublished'
  },
  // 修正：必須使用 STRING 對應 nvarchar
  PageUrl: { 
    type: DataTypes.STRING(100), // STRING = nvarchar (Sequelize 預設)
    allowNull: false,
    field: 'PageUrl'
  },
  // --- 日期雙重保險開始 ---
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // 程式層級的 getdate()
    field: 'CreatedAt'
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'UpdatedAt'
  }
}, {
  tableName: 'StorePage', // 鎖定表名，防止變複數
  
  // 修正：開啟 timestamps (最佳實踐)
  timestamps: true, 
  
  // 修正：手動指定 Sequelize 預設的小寫名稱對應到你資料庫的大寫欄位
  createdAt: 'CreatedAt', // Sequelize 內部叫 createdAt，對應 DB 的 CreatedAt
  updatedAt: 'UpdatedAt', // Sequelize 內部叫 updatedAt，對應 DB 的 UpdatedAt
});

module.exports = StorePage;
