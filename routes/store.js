// 模組對應資料表：StorePage, PageContent, PageProduct
const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')
// 在檔案頂部先確保引用 Sequelize (用來寫資料庫原生函數)
const { Sequelize } = require('sequelize');

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
  const Mock = await useMock();
  const Lang = req.query.lang || 'zh-TW';
  const PageID = Number(req.params.PageID);

  if (Mock) {
    // Mock 邏輯保持不變...
    const { pages, page: template } = readMock('storepage.json');
    const found = (pages || []).find((p) => Number(p.PageID) === PageID);
    const base = found || template;
    return res.json({
      ...base,
      PageID,
      PageContent: { ...(base.PageContent || {}), PageID, LanguageCode: Lang }
    });
  }

  try {
    const { StorePage, PageContent } = require('../models');

    // 1. 使用 findOrCreate 確保 StorePage 一定存在
    // 如果找不到 PageID，會自動新增一筆，defaults 是新增時才用的預設值
    const [page, created] = await StorePage.findOrCreate({
      where: { PageID: PageID },
      defaults: {
        // ✅ 補上這些必填欄位
        SellerID: 15, 
        TemplateName: "default",
        PageUrl: `shop-${PageID}-${Date.now()}`, // 確保網址唯一性
        StoreLogo: "https://www.figma.com/api/mcp/asset/665605e6-519c-4fa0-8070-daa26e795351", // 預設占位圖
        IsPublished: false,
        UpdatedAt: Sequelize.literal('GETDATE()')
      }
    });

    // 2. 嘗試抓取該語言的內容
    let content = await PageContent.findOne({
      where: { PageID: PageID, LanguageCode: Lang }
    });

    // 3. 如果找不到該語言的內容 (或者是新建立的 Page)，就幫他建一個空白模板
    if (!content) {
      content = await PageContent.create({
        PageID: PageID,
        LanguageCode: Lang,
        PageTitle: "",
        PageDescription: "",
        // ✅ 補上資料庫規定的必填欄位
        ProductID: 26,           // 暫時隨便給一個商品 ID
        ProductName: "預設商品",  // 初始商品名稱
        CTA_Text: "立即購買",    // 初始按鈕文字
        UpdatedAt: Sequelize.literal('GETDATE()')
      });
      console.log(`[System] 已為 PageID ${PageID} 初始化語言內容: ${Lang}`);
    }

    // 4. 回傳懶人包格式 (前端完全不用改)
    return res.json({
      success: true,
      data: {
        PageTitle: content.PageTitle,
        PageDescription: content.PageDescription,
        StoreLogo: page.StoreLogo
      }
    });

  } catch (err) {
    console.error("讀取或初始化頁面失敗:", err);
    return res.status(500).json({ success: false, message: "伺服器初始化失敗" });
  }
});

router.post('/pages/:PageID/update', async (req, res) => {
  const PageID = Number(req.params.PageID);
  const { isPublished, shopName, shopDesc, logoUrl } = req.body; 
  
  const Mock = await useMock();

  if (Mock) {
    console.log(`[Mock] 接收到 PageID ${PageID} 的更新請求`);
    return res.json({ success: true, message: 'Mock 儲存成功' });
  }

  try {
    const { StorePage, PageContent } = require('../models');

    // 1. 更新商店主表
    await StorePage.update(
      { 
        IsPublished: isPublished,
        StoreLogo: logoUrl,
        // 核心修正：改用 Sequelize.literal('GETDATE()') 讓資料庫自己產生時間
        // 這樣就不會再噴 "Conversion failed" 錯誤了
        UpdatedAt: Sequelize.literal('GETDATE()') 
      },
      { where: { PageID: PageID } }
    );

    // 2. 更新商店內容
    await PageContent.update(
      { 
        PageTitle: shopName,
        PageDescription: shopDesc,
        // 同樣這裡也要改
        UpdatedAt: Sequelize.literal('GETDATE()')
      },
      { where: { PageID: PageID } }
    );

    return res.json({ success: true, message: isPublished ? '賣場已正式發布！' : '草稿儲存成功！' });
  } catch (err) {
    console.error('資料庫更新失敗:', err); // 這裡會印出詳細錯誤到你的終端機
    return res.status(500).json({ success: false, message: '伺服器寫入失敗' });
  }
});
console.log("✅ store.js 路由檔案已成功載入");
// POST /api/store/create-new-shop
// routes/store.js

// routes/store.js

router.post('/create-new-shop', async (req, res) => {
    try {
        const Sequelize = require('sequelize'); // 確保這行在頂端或此處
        const { StorePage } = require('../models');

        const newPage = await StorePage.create({
            SellerID: 15,           
            TemplateName: "Default", 
            PageUrl: `shop-${Date.now()}`, 
            StoreLogo: "",
            IsPublished: false,
            // ✅ 修正：SQL Server 請用 GETDATE()
            UpdatedAt: Sequelize.literal('GETDATE()') 
        });

        // 成功領到號碼牌，回傳 ID
        res.json({ success: true, pageId: newPage.PageID });

    } catch (err) {
        console.error('建立新賣場失敗:', err);
        res.status(500).json({ success: false, message: "無法建立新賣場" });
    }
});
module.exports = router
