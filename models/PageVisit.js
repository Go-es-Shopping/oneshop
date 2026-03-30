const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PageVisit = sequelize.define('PageVisit', {
  VisitID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'VisitID'
  },
  // 商品編號 (可為空，首頁時為 null)
  ProductID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ProductID'
  },
  // 頁面類型 (例如 'Home', 'Product')
  PageType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'PageType'
  },
  // 來源網址 (Referrer)
  Referrer: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'Referrer'
  },
  // IP 位址
  IPAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'IPAddress'
  },
  // 建立時間
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'CreatedAt'
  }
}, {
  tableName: 'PageVisit',
  timestamps: false
});

module.exports = PageVisit;
