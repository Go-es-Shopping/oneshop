// 模組對應資料表：StorePage, PageContent, PageProduct
const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')

const router = express.Router()

async function useMock() {
  if (process.env.FORCE_MOCK === 'true') return true
  try {
    await sequelize.authenticate()
    return false
  } catch {
    return true
  }
}

router.get('/pages', async (req, res) => {
  const Mock = await useMock()
  const Lang = req.query.lang || 'zh-TW'
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（StorePage join PageContent by LanguageCode）
  if (Mock) {
    const MockData = readMock('storepage.json').pages
    const Data = MockData.map((p) => ({
      ...p,
      PageContent: { ...p.PageContent, LanguageCode: Lang }
    }))
    return res.json(Data)
  }
  return res.json([])
})

router.get('/pages/:PageID', async (req, res) => {
  const Mock = await useMock()
  const Lang = req.query.lang || 'zh-TW'
  const PageID = Number(req.params.PageID)
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（單一 Page 與 PageContent、PageProduct 關聯）
  if (Mock) {
    const Base = readMock('storepage.json').page
    const Data = {
      ...Base,
      PageID: PageID,
      PageContent: { ...Base.PageContent, PageID: PageID, LanguageCode: Lang },
      PageProducts: Base.PageProducts.map((pp) => ({ ...pp, PageID: PageID }))
    }
    return res.json(Data)
  }
  return res.json({})
})

module.exports = router
