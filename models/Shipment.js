const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Shipment = sequelize.define('Shipment', {
  ShipmentID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  OrderID: { type: DataTypes.INTEGER, allowNull: false },
  ShippingMethod: { type: DataTypes.STRING(50), allowNull: false },
  TrackingNumber: { type: DataTypes.STRING(100), allowNull: false },
  ShipmentStatus: { type: DataTypes.STRING(30), allowNull: false },
  ShippedAt: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'Shipment', timestamps: false })

module.exports = Shipment
