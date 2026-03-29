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
  // 商品圖路徑 (可能很長，使用 STRING 支援 nvarchar(MAX))
  ProductImg: {
    type: DataTypes.STRING, 
    allowNull: true,
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
  tableName: 'Product',
  // 由資料庫 DEFAULT GETDATE() 接管日期，避免格式轉換錯誤
  timestamps: false
});

module.exports = Product;