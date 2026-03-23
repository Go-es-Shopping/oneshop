const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Orderdetail = sequelize.define('Orderdetail', {
  // 訂單明細 ID
  OrderdetailID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'OrderdetailID'
  },
  // 關聯的主訂單 ID
  OrderID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'OrderID'
  },
  // 關聯的商品 ID
  ProductID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ProductID'
  },
  // 購買數量
  Quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'Quantity'
  },
  // 購買時的單價 (避免日後商品調價影響舊訂單紀錄)
  UnitPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'UnitPrice'
  }
}, {
  tableName: 'Orderdetail',
  // 根據你的 DB 截圖，此表目前沒有日期欄位，故關閉 timestamps
  timestamps: false 
});

module.exports = Orderdetail;