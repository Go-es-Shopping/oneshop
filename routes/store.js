// 模組對應資料表：StorePage, PageContent, PageProduct
const express = require('express')
const sequelize = require('../config/database')

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
  const data = [
    {
      PageID: 10,
      SellerID: 123,
      TemplateName: 'OnePageV1',
      IsPublished: 1,
      PageUrl: 'acme',
      PageContent: {
        LanguageCode: lang,
        PageTitle: 'ACME 一頁購物',
        PageDescription: '精選商品與限時優惠',
        CTA_Text: '立即下單'
      }
    }
  ]
  return res.json(data)
})

router.get('/pages/:PageID', async (req, res) => {
  const mock = await useMock()
  const lang = req.query.lang || 'zh-TW'
  const pageId = Number(req.params.PageID)
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（單一 Page 與 PageContent、PageProduct 關聯）
  const data = {
    PageID: pageId,
    SellerID: 123,
    TemplateName: 'OnePageV1',
    IsPublished: 1,
    PageUrl: 'acme',
    PageContent: {
      PageContentID: 501,
      PageID: pageId,
      LanguageCode: lang,
      PageTitle: 'ACME 一頁購物',
      PageDescription: '精選商品與限時優惠',
      CTA_Text: '立即下單'
    },
    PageProducts: [
      {
        PageProductID: 9001,
        PageID: pageId,
        DisplayOrder: 1,
        isFeatured: 1
      }
    ]
  }
  return res.json(data)
})

module.exports = router
