// 模組對應資料表：Order, Orderdetail, Payment, Shipment
const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')

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
  if (mock) {
    const base = readMock('order.json').created
    const data = {
      ...base,
      OrderID: orderId,
      SellerID: body.SellerID || base.SellerID,
      BuyerName: body.BuyerName || base.BuyerName,
      BuyerPhone: body.BuyerPhone || base.BuyerPhone,
      BuyerEmail: body.BuyerEmail || base.BuyerEmail,
      BuyerAddress: body.BuyerAddress || base.BuyerAddress,
      UTM_Source: body.utm_source || null
    }
    return res.status(201).json(data)
  }
  const data = {}
  return res.status(201).json(data)
})

router.get('/:OrderID', async (req, res) => {
  const mock = await useMock()
  const id = Number(req.params.OrderID)
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（Order join Orderdetail/Payment/Shipment）
  if (mock) {
    const base = readMock('order.json').detail
    const data = { ...base, OrderID: id, Shipment: { ...base.Shipment, OrderID: id }, Payment: { ...base.Payment, OrderID: id }, Items: base.Items.map(i => ({ ...i, OrderID: id })) }
    return res.json(data)
  }
  const data = {}
  return res.json(data)
})

router.get('/', async (req, res) => {
  const mock = await useMock()
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（賣家後台列表、可依狀態過濾/分頁）
  if (mock) {
    const list = readMock('order.json').list
    return res.json(list)
  }
  const data = []
  return res.json(data)
})

module.exports = router
