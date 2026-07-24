const { DataTypes } = require('sequelize');
// 假設你的 sequelize 實例初始化在 config/database.js
const sequelize = require('../config/database'); 

const Coupon = sequelize.define('Coupon', {
  CouponID: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, // 對應 SQL Server 的 Identity
    primaryKey: true,
    field: 'CouponID' 
  },
  SellerID: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    field: 'SellerID'
  },
  Title: { 
    type: DataTypes.STRING(100), // 對應 nvarchar(100)
    allowNull: false,
    field: 'Title'
  },
  Code: { 
    type: DataTypes.STRING(50),  // 對應 varchar(50)
    allowNull: false,
    unique: true,
    field: 'Code'
  },
  DiscountType: { 
    type: DataTypes.STRING(50),  // 對應 nvarchar(50)
    allowNull: false,
    field: 'DiscountType'
  },
  MinSpend: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true,
    field: 'MinSpend'
  },
  DiscountValue: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true,
    field: 'DiscountValue'
  },
  UsageLimit: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    field: 'UsageLimit'
  },
  TotalQuantity: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    field: 'TotalQuantity'
  },
  IsExclusive: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false,
    defaultValue: false,
    field: 'IsExclusive'
  },
  StartDate: { 
    type: DataTypes.DATEONLY, // 如果只要存年月日，用 DATEONLY 很適合
    allowNull: true,
    field: 'StartDate'
  },
  EndDate: { 
    type: DataTypes.DATEONLY, 
    allowNull: true,
    field: 'EndDate'
  },
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'CreatedAt'
  }
}, {
  tableName: 'Coupon', // 鎖定表名，防止變複數
  timestamps: false,    // 由資料庫 DEFAULT GETDATE() 接管日期
});

module.exports = Coupon;