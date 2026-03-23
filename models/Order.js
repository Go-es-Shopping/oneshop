const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  // 訂單編號 (PK)
  OrderID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'OrderID'
  },
  // 賣家 ID
  SellerID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'SellerID'
  },
  // 買家姓名，支援中文 (nvarchar)
  BuyerName: {
    type: DataTypes.WSTRING(100),
    allowNull: false,
    field: 'BuyerName'
  },
  // 買家電話
  BuyerPhone: {
    type: DataTypes.WSTRING(20),
    allowNull: false,
    field: 'BuyerPhone'
  },
  // 買家信箱
  BuyerEmail: {
    type: DataTypes.WSTRING(255),
    allowNull: false,
    field: 'BuyerEmail'
  },
  // 收件地址，支援中文 (nvarchar)
  BuyerAddress: {
    type: DataTypes.WSTRING(300),
    allowNull: false,
    field: 'BuyerAddress'
  },
  // 訂單狀態 (如：待處理、已完成)
  OrderStatus: {
    type: DataTypes.WSTRING(30),
    allowNull: false,
    field: 'OrderStatus'
  },
  // 總金額 (decimal(12,2))
  TotalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'TotalAmount'
  },
  // 付款狀態 (int，例如 0:未付, 1:已付)
  PaymentStatus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'PaymentStatus'
  },
  // --- 日期雙重保險開始 ---
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'UpdatedAt'
  }
}, {
  tableName: 'Order',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

module.exports = Order;
