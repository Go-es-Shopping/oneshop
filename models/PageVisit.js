const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PageVisit = sequelize.define('PageVisit', {
  VisitID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'VisitID'
  },
  // 商品編號 (可為空，首頁時為 null)
  ProductID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ProductID'
  },
  // models/PageVisit.js 裡面
SellerID: {
  type: DataTypes.INTEGER,
  allowNull: true, // 既然你設了 FK，通常這裡不能為空
  references: {
    model: 'Seller', // 對應資料庫的表名
    key: 'SellerID',
    field: 'SellerID'
  }
},
  // 頁面類型 (例如 'Home', 'Product','About')
  PageType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'PageType'
  },
  // 來源網址 (Referrer)
  Referrer: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Referrer'
  },
  // IP 位址
  IPAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'IPAddress'
  },
  // 使用者代理 (UserAgent)
  UserAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'UserAgent'
  },
  // 瀏覽器 Session ID，用於串接 Order 轉換路徑
  SessionID: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'SessionID'
  },
  // 用於存放 OpenAI 分析數據 (JSON 格式，SQL Server 存為 NVARCHAR(MAX))
  Metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'Metadata'
  },
  // 建立時間
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  }
}, {
  tableName: 'PageVisit',
  timestamps: false
});

module.exports = PageVisit;
