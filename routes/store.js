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
  if (mock) {
    const mockData = readMock('storepage.json').pages
    const data = mockData.map((p) => ({
      ...p,
      PageContent: { ...(p.PageContent || {}), LanguageCode: lang },
      PageProducts: Array.isArray(p.PageProducts) ? p.PageProducts : []
    }))
    return res.json(data)
  }
  // TODO: 使用 Sequelize 查詢列表：
  // const { StorePage, PageContent, PageProduct, Product } = require('../models')
  // const pages = await StorePage.findAll({
  //   include: [
  //     { model: PageContent, where: { LanguageCode: lang }, required: false },
  //     { model: PageProduct, include: [{ model: Product }], required: false }
  //   ]
  // })
  // return res.json(pages)
  return res.json([])
})

router.get('/pages/:PageID', async (req, res) => {
  const mock = await useMock()
  const lang = req.query.lang || 'zh-TW'
  const pageId = Number(req.params.PageID)
  if (mock) {
    const { pages, page: template } = readMock('storepage.json')
    const found = (pages || []).find((p) => Number(p.PageID) === pageId)
    const base = found || template
    const data = {
      ...base,
      PageID: pageId,
      PageContent: { ...(base.PageContent || {}), PageID: pageId, LanguageCode: lang },
      PageProducts: Array.isArray(base.PageProducts)
        ? base.PageProducts.map((pp) => ({ ...pp, PageID: pageId }))
        : []
    }
    return res.json(data)
  }
  // TODO: 使用 Sequelize 查詢單筆：
  // const { StorePage, PageContent, PageProduct, Product } = require('../models')
  // const one = await StorePage.findByPk(pageId, {
  //   include: [
  //     { model: PageContent, where: { LanguageCode: lang }, required: false },
  //     { model: PageProduct, include: [{ model: Product }], required: false }
  //   ]
  // })
  // return res.json(one ?? {})
  return res.json({})
})

module.exports = router
