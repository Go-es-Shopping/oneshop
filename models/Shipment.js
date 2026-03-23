const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  // 物流編號，對應 SQL Server 的 Identity
  ShipmentID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'ShipmentID'
  },
  // 關聯訂單 ID
  OrderID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'OrderID'
  },
  // 運送方式 (如：黑貓、店到店)，使用 STRING 支援 nvarchar
  ShippingMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'ShippingMethod'
  },
  // 物流單號，使用 STRING 支援 nvarchar
  TrackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'TrackingNumber'
  },
  // 物流狀態 (如：待出貨、已出貨)，使用 STRING 支援 nvarchar
  ShipmentStatus: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'ShipmentStatus'
  },
  // 出貨時間雙重保險：
  // 1. 程式層級：新增資料時若未帶入時間，Sequelize 會自動填入 NOW
  // 2. 資料庫層級：對應你設定的 getdate() 預設值
  ShippedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, 
    field: 'ShippedAt'
  }
}, {
  tableName: 'Shipment',
  // 注意：因為這張表在你的 DB 設計中只有 ShippedAt，
  // 並沒有成對的 CreatedAt/UpdatedAt，所以我們維持關閉自動時間管理
  timestamps: false 
});

module.exports = Shipment;