// 模組對應資料表：Product, PageProduct, PageContent
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

router.get('/', async (req, res) => {
  const mock = await useMock()
  const lang = req.query.lang || 'zh-TW'
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（依 SellerID/PageID/IsActive + 語系）
  if (mock) {
    const list = readMock('product.json').list.map((p) => ({
      ...p,
      LanguageCode: lang
    }))
    return res.json(list)
  }
  const data = []
  return res.json(data)
})

router.get('/:ProductID', async (req, res) => {
  const mock = await useMock()
  const lang = req.query.lang || 'zh-TW'
  const id = Number(req.params.ProductID)
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（指定 Product 與對應語系內容）
  if (mock) {
    const base = readMock('product.json').detail
    const data = {
      ...base,
      ProductID: id,
      ProductImg: `https://cdn.example.com/p/${id}.png`,
      LanguageCode: lang
    }
    return res.json(data)
  }
  const data = {}
  return res.json(data)
})

module.exports = router
