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
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'BuyerName'
  },
  // 買家電話
  BuyerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'BuyerPhone'
  },
  // 買家信箱
  BuyerEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'BuyerEmail'
  },
  // 收件地址，支援中文 (nvarchar)
  BuyerAddress: {
    type: DataTypes.STRING(300),
    allowNull: false,
    field: 'BuyerAddress'
  },
  // 訂單狀態 (如：待處理、已完成)
  OrderStatus: {
    type: DataTypes.STRING(30),
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
  tableName: 'Order',
  timestamps: false // 由資料庫 DEFAULT GETDATE() 接管日期
});

module.exports = Order;
