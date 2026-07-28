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
  // 優惠卷 ID
  CouponID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'CouponID'
  },
  // 優惠卷代碼
  CouponCode: {
    type: DataTypes.STRING(50),  // 對應 varchar(50)
    allowNull: true,
    field: 'CouponCode'
  },
  // 折抵金額
  DiscountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'DiscountValue'
  },
  // 優惠卷代碼
  CouponCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'CouponCode'
  },
  // 折抵金額
  DiscountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'DiscountValue'
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
  // 💡 修正點：將 STRING(30) 改為 INTEGER，完美對接 Controller 的 0, 1, 2, 3, 9 狀態數字
  OrderStatus: {
    type: DataTypes.INTEGER,
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
  // 來源 UTM 標籤 (例如：Facebook, Google)
  UTM_Source: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'UTM_Source'
  },
  // 瀏覽器 Session ID，用於串接 PageVisit 轉換路徑
  SessionID: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'SessionID'
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
