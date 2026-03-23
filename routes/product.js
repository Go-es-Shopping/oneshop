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
  const Mock = await useMock()
  const Lang = req.query.lang || 'zh-TW'
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（依 SellerID/PageID/IsActive + 語系）
  if (Mock) {
    const List = readMock('product.json').list.map((p) => ({
      ...p,
      LanguageCode: Lang
    }))
    return res.json(List)
  }
  return res.json([])
})

router.get('/:ProductID', async (req, res) => {
  const Mock = await useMock()
  const Lang = req.query.lang || 'zh-TW'
  const ProductID = Number(req.params.ProductID)
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（指定 Product 與對應語系內容）
  if (Mock) {
    const Base = readMock('product.json').detail
    const Data = {
      ...Base,
      ProductID: ProductID,
      ProductImg: `https://cdn.example.com/p/${ProductID}.png`,
      LanguageCode: Lang
    }
    return res.json(Data)
  }
  return res.json({})
})

module.exports = router
