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
    allowNull: true,
    field: 'TrackingNumber'
  },
  // 物流狀態 (如：待出貨、已出貨)，使用 STRING 支援 nvarchar
  ShipmentStatus: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'ShipmentStatus'
  },
  // 出貨時間修正：讓資料庫 DEFAULT GETDATE() 接管
  ShippedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ShippedAt'
  }
}, {
  tableName: 'Shipment',
  // 注意：因為這張表在你的 DB 設計中只有 ShippedAt，
  // 並沒有成對的 CreatedAt/UpdatedAt，所以我們維持關閉自動時間管理
  timestamps: false 
});

module.exports = Shipment;