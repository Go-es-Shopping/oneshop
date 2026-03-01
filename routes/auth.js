// 模組對應資料表：Seller
const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')

const router = express.Router()

function formatDecimal(n) {
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

router.post('/login', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const seller = readMock('seller.json')
    return res.json({ ...seller, AccessToken: 'JWT_TOKEN' })
  }
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（比對帳密，回傳 Seller 與 Token）
  return res.json({
    SellerID: 123,
    SellerName: 'ACME',
    StoreName: 'ACME Store',
    Email: 'owner@acme.com',
    PlanType: 1,
    Status: 1,
    AccessToken: 'JWT_TOKEN'
  })
})

router.get('/me', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const seller = readMock('seller.json')
    return res.json(seller)
  }
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（依 AccessToken 取得 Seller 資訊）
  return res.json({
    SellerID: 123,
    SellerName: 'ACME',
    StoreName: 'ACME Store',
    Email: 'owner@acme.com',
    Phone: '+886912345678',
    PlanType: 1,
    Status: 1
  })
})

router.post('/logout', (req, res) => {
  return res.json({ Success: true })
})

module.exports = router
