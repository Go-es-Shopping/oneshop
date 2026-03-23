const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  // 付款編號，對應 SQL Server 的 Identity
  PaymentID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'PaymentID'
  },
  // 關聯訂單 ID
  OrderID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'OrderID'
  },
  // 付款方式 (如：信用卡、匯款)，使用 STRING 支援 nvarchar
  PaymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'PaymentMethod'
  },
  // 付款狀態 (如：待支付、已支付)，使用 STRING 支援 nvarchar
  PaymentStatus: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'PaymentStatus'
  },
  // 付款日期雙重保險：
  // 1. 程式層級：新增資料時若未帶入時間，Sequelize 會自動填入 NOW
  // 2. 資料庫層級：對應你設定的 (getdate()) 預設值
  PaidAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, 
    field: 'PaidAt'
  }
}, {
  tableName: 'Payment',
  // 注意：這張表在你的 DB 中只有單一日期欄位 PaidAt，
  // 並無成對的 CreatedAt/UpdatedAt，故關閉自動時間管理
  timestamps: false 
});

module.exports = Payment;