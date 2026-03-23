const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PageProduct = sequelize.define('PageProduct', {
  // 中間關聯表的主鍵
  PageProductID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'PageProductID'
  },
  // 關聯到 StorePage 表
  PageID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'PageID'
  },
  // 關聯到 Product 表
  ProductID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ProductID'
  },
  // 商品在頁面上的排序 (數字越小通常排越前面)
  DisplayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'DisplayOrder'
  },
  // 是否為精選商品 (對應 bit)
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'isFeatured' // 注意：此欄位在 DB 是小寫 i 開頭
  },
  // --- 日期雙重保險開始 ---
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // 程式層級保險
    field: 'CreatedAt'
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // 程式層級保險
    field: 'UpdatedAt'
  }
}, {
  tableName: 'PageProduct',
  timestamps: true, // 務必開啟
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

module.exports = PageProduct;
