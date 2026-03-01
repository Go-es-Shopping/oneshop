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
  const mock = await useMock()
  const lang = req.query.lang || 'zh-TW'
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（StorePage join PageContent by LanguageCode）
  if (mock) {
    const mockData = readMock('storepage.json').pages
    const data = mockData.map((p) => ({
      ...p,
      PageContent: { ...p.PageContent, LanguageCode: lang }
    }))
    return res.json(data)
  }
  const data = []
  return res.json(data)
})

router.get('/pages/:PageID', async (req, res) => {
  const mock = await useMock()
  const lang = req.query.lang || 'zh-TW'
  const pageId = Number(req.params.PageID)
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（單一 Page 與 PageContent、PageProduct 關聯）
  if (mock) {
    const base = readMock('storepage.json').page
    const data = {
      ...base,
      PageID: pageId,
      PageContent: { ...base.PageContent, PageID: pageId, LanguageCode: lang },
      PageProducts: base.PageProducts.map((pp) => ({ ...pp, PageID: pageId }))
    }
    return res.json(data)
  }
  const data = {}
  return res.json(data)
})

module.exports = router
