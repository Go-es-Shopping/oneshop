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
  // --- 日期欄位修正：讓資料庫 DEFAULT GETDATE() 接管 ---
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'CreatedAt'
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'UpdatedAt'
  },
  StoreLogo: {
    type: DataTypes.TEXT, // 對應資料庫的 nvarchar(MAX)
    allowNull: true       // 允許為空，因為剛開始可能還沒上傳
  }
}, {
  tableName: 'StorePage', // 鎖定表名，防止變複數
  
  // 修正：由資料庫 DEFAULT GETDATE() 接管日期，避免格式轉換錯誤
  timestamps: false, 
});

module.exports = StorePage;
