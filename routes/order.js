// 模組對應資料表：Order, Orderdetail, Payment, Shipment
const express = require('express')
const sequelize = require('../config/database')

const router = express.Router()

function money(n) {
  return Number(n).toFixed(2)
}

async function useMock() {
  if (process.env.FORCE_MOCK === 'true') return true
  try {
    await sequelize.authenticate()
    return false
  } catch {
    return true
  }
}

router.post('/', async (req, res) => {
  const mock = await useMock()
  const body = req.body || {}
  const orderId = 70001
  // TODO: 這裡請組員實作實際的 Sequelize 交易流程（建立 Order、Orderdetail、Payment/Shipment）
  const data = {
    OrderID: orderId,
    SellerID: body.SellerID || 123,
    BuyerName: body.BuyerName || '王小明',
    BuyerPhone: body.BuyerPhone || '+886912345678',
    BuyerEmail: body.BuyerEmail || 'buyer@example.com',
    BuyerAddress: body.BuyerAddress || '台北市中正區 XX 路 1 號',
    OrderStatus: 0,
    PaymentStatus: 0,
    TotalAmount: money(1990),
    Items: [
      {
        OrderdetailID: 1,
        OrderID: orderId,
        ProductID: 2001,
        Quantity: 1,
        UnitPrice: money(1990)
      }
    ]
  }
  return res.status(201).json(data)
})

router.get('/:OrderID', async (req, res) => {
  const mock = await useMock()
  const id = Number(req.params.OrderID)
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（Order join Orderdetail/Payment/Shipment）
  const data = {
    OrderID: id,
    SellerID: 123,
    BuyerName: '王小明',
    OrderStatus: 0,
    PaymentStatus: 0,
    TotalAmount: money(1990),
    Shipment: {
      ShipmentID: 3001,
      OrderID: id,
      ShippingMethod: 'HomeDelivery',
      TrackingNumber: null,
      ShipmentStatus: 0,
      ShippedAt: '2026-03-01T10:00:00Z'
    },
    Payment: {
      PaymentID: 4001,
      OrderID: id,
      PaymentMethod: 'CreditCard',
      PaymentStatus: 0
    },
    Items: [
      {
        OrderdetailID: 1,
        OrderID: id,
        ProductID: 2001,
        Quantity: 1,
        UnitPrice: money(1990)
      }
    ]
  }
  return res.json(data)
})

router.get('/', async (req, res) => {
  const mock = await useMock()
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（賣家後台列表、可依狀態過濾/分頁）
  const data = [
    {
      OrderID: 70001,
      SellerID: 123,
      OrderStatus: 0,
      PaymentStatus: 0,
      TotalAmount: money(1990)
    }
  ]
  return res.json(data)
})

module.exports = router
