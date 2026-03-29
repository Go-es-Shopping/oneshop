const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PageContent = sequelize.define('PageContent', {
  // 內容 ID
  PageContentID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'PageContentID'
  },
  // 關聯的頁面 ID
  PageID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'PageID'
  },
  // 關聯的商品 ID
  ProductID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ProductID'
  },
  // 語言代碼 (如：zh-TW, en-US)
  LanguageCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'LanguageCode'
  },
  // 頁面大標題
  PageTitle: {
    type: DataTypes.STRING(200),
    allowNull: true, // 根據你的圖片，此欄位勾選了允許 Null
    field: 'PageTitle'
  },
  // 頁面詳細描述 (nvarchar(MAX))
  PageDescription: {
    type: DataTypes.STRING, // 不設長度對應 MAX
    allowNull: true,
    field: 'PageDescription'
  },
  // 商品顯示名稱
  ProductName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'ProductName'
  },
  // 商品詳細描述 (nvarchar(MAX))
  ProductDescription: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ProductDescription'
  },
  // 行動呼籲文字 (如：立即購買、加入購物車)
  CTA_Text: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'CTA_Text'
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
  }
}, {
  tableName: 'PageContent',
  timestamps: false // 由資料庫 DEFAULT GETDATE() 接管日期
});

module.exports = PageContent;