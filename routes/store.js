// 模組對應資料表：StorePage, PageContent, PageProduct
const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')

const router = express.Router()

async function useMock() {
  // 優先判定 Mock，不執行資料庫檢查以解決連線超時問題
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
  
  if (Mock) {
    const MockData = readMock('storepage.json').pages
    const Data = MockData.map((p) => ({
      ...p,
      PageContent: { ...(p.PageContent || {}), LanguageCode: Lang },
      PageProducts: Array.isArray(p.PageProducts) ? p.PageProducts : []
    }))
    return res.json(Data)
  }

  // TODO: 使用 Sequelize 查詢列表：
  // const { StorePage, PageContent, PageProduct, Product } = require('../models')
  // const pages = await StorePage.findAll({
  //   include: [
  //     { model: PageContent, where: { LanguageCode: Lang }, required: false },
  //     { model: PageProduct, include: [{ model: Product }], required: false }
  //   ]
  // })
  // return res.json(pages)
  return res.json([])
})

router.get('/pages/:PageID', async (req, res) => {
  const Mock = await useMock()
  const Lang = req.query.lang || 'zh-TW'
  const PageID = Number(req.params.PageID)

  if (Mock) {
    const { pages, page: template } = readMock('storepage.json')
    const found = (pages || []).find((p) => Number(p.PageID) === PageID)
    const base = found || template
    const Data = {
      ...base,
      PageID: PageID,
      PageContent: { ...(base.PageContent || {}), PageID: PageID, LanguageCode: Lang },
      PageProducts: Array.isArray(base.PageProducts)
        ? base.PageProducts.map((pp) => ({ ...pp, PageID: PageID }))
        : []
    }
    return res.json(Data)
  }

  // TODO: 使用 Sequelize 查詢單筆：
  // const { StorePage, PageContent, PageProduct, Product } = require('../models')
  // const one = await StorePage.findByPk(PageID, {
  //   include: [
  //     { model: PageContent, where: { LanguageCode: Lang }, required: false },
  //     { model: PageProduct, include: [{ model: Product }], required: false }
  //   ]
  // })
  // return res.json(one ?? {})
  return res.json({})
})

module.exports = router
