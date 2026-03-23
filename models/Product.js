const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  // 商品編號，對應 SQL Server 的 Identity
  ProductID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'ProductID'
  },
  // 關聯賣家 ID
  SellerID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'SellerID'
  },
  // 商品圖片，nvarchar(MAX) 對應 WSTRING，支援長網址與 Unicode
  ProductImg: {
    type: DataTypes.WSTRING, 
    allowNull: false,
    field: 'ProductImg'
  },
  // 商品價格，精確度對應 decimal(18,2)
  Price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    field: 'Price'
  },
  // 庫存數量
  Stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'Stock'
  },
  // 是否啟用/上架 (bit)
  IsActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'IsActive'
  },
  // --- 日期雙重保險開始 ---
  // 對應 DB 的 CreatedAt 與 (getdate()) 預設值
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // 程式層級保險
    field: 'CreatedAt'
  },
  // 對應 DB 的 UpdatedAt 與 (getdate()) 預設值
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // 程式層級保險
    field: 'UpdatedAt'
  }
}, {
  tableName: 'Product',
  // 開啟自動時間管理，確保更新商品資訊時 UpdatedAt 會跳動
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

module.exports = Product;