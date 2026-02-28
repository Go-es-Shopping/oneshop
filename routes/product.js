// 模組對應資料表：Product, PageProduct, PageContent
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

router.get('/', async (req, res) => {
  const mock = await useMock()
  const lang = req.query.lang || 'zh-TW'
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（依 SellerID/PageID/IsActive + 語系）
  const data = [
    {
      ProductID: 2001,
      SellerID: 123,
      ProductImg: 'https://cdn.example.com/p/2001.png',
      Price: money(1990),
      Stock: 50,
      IsActive: 1,
      LanguageCode: lang,
      ProductName: 'ACME 經典組合',
      ProductDescription: '人氣暢銷，限時優惠'
    }
  ]
  return res.json(data)
})

router.get('/:ProductID', async (req, res) => {
  const mock = await useMock()
  const lang = req.query.lang || 'zh-TW'
  const id = Number(req.params.ProductID)
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（指定 Product 與對應語系內容）
  const data = {
    ProductID: id,
    SellerID: 123,
    ProductImg: `https://cdn.example.com/p/${id}.png`,
    Price: money(1990),
    Stock: 50,
    IsActive: 1,
    LanguageCode: lang,
    ProductName: 'ACME 經典組合',
    ProductDescription: '人氣暢銷，限時優惠'
  }
  return res.json(data)
})

module.exports = router
