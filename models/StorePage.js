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
},
  // 加設計系統欄位
  ThemeColor: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: '冷靜石板',
    field: 'ThemeColor'
  },
  ThemeFont: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'gothic',
    field: 'ThemeFont'
  },
  //核心新增：店鋪聯絡資訊欄位
  StoreEmail: {
    type: DataTypes.STRING(255), // nvarchar(255)，足夠容納絕大多數 Email
    allowNull: true,              // 允許為空，配合未來賣家可略過不填的邏輯
    field: 'StoreEmail'           // 顯式映射資料庫欄位
  },
  StorePhone: {
    type: DataTypes.STRING(50),  // nvarchar(50)，容納市話或手機與分機
    allowNull: true,              // 允許為空
    field: 'StorePhone'           // 顯式映射資料庫欄位
  },
  // 核心新增：收款銀行帳戶欄位
  StoreBankAccount: {
    type: DataTypes.STRING(100), // nvarchar(100)，足夠容納銀行代碼加帳號（例如: 812-1234567890）
    allowNull: true,             // 允許為空，配合賣家可稍後再填的邏輯
    field: 'StoreBankAccount'    // 顯式映射資料庫欄位
  }
}, {
  tableName: 'StorePage', // 鎖定表名，防止變複數
  
  // 修正：由資料庫 DEFAULT GETDATE() 接管日期，避免格式轉換錯誤
  timestamps: false, 
});

module.exports = StorePage;
