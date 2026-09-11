// 模組對應資料表：StorePage, PageContent, PageProduct
const express = require('express')
const sequelize = require('../config/database')
const { readMock, writeMock } = require('../src/mocks/utils') // 💡 新增引用 writeMock 用於儲存草稿
// 在檔案頂部先確保引用 Sequelize (用來寫資料庫原生函數)
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { upload } = require('../config/cloudinary')

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

  return res.json([])
})

router.get('/pages/:PageID', async (req, res) => {
  const Mock = await useMock();
  const Lang = req.query.lang || 'zh-TW';
  const PageID = Number(req.params.PageID);

  if (Mock) {
    const { pages, page: template } = readMock('storepage.json');
    const found = (pages || []).find((p) => Number(p.PageID) === PageID);
    const base = found || template;
    return res.json({
      success: true, // 💡 對齊實體格式
      data: {
        PageTitle: base.PageContent?.PageTitle || "",
        PageDescription: base.PageContent?.PageDescription || "",
        StoreLogo: base.StoreLogo || "",
        // 🎨 ✅ 統一：Mock 模式也只從 StorePage 層級讀取 ThemeColor 和 ThemeFont
        ThemeColor: base.ThemeColor || '冷靜石板',
        ThemeFont: base.ThemeFont || 'gothic',
        //從 (StorePage) 結構層級抓取聯絡資訊！
        StoreEmail: base.StoreEmail || "", 
        StorePhone: base.StorePhone || "",
        StoreBankAccount: base.StoreBankAccount || "" ,
        PageUrl: base.PageUrl || "" // 🔗 【新增這裡】Mock 模式回傳專屬網址後綴
      }
    });
  }

  try {
    // 💡 確保引入所有需要的 Model，並同時引入 db 實例以防 Sequelize 沒被定義
    const db = require('../models');
    const { StorePage, PageContent, PageProduct, Product } = db;
    // 安全防禦：如果外面沒定義 Sequelize，我們直接從 db 拿，或者用字串，確保不崩潰
    const sqlLiteral = db.sequelize ? db.sequelize.literal('GETDATE()') : new Date();

    // 1. 使用 findOrCreate 確保 StorePage 一定存在
    const [page, created] = await StorePage.findOrCreate({
      where: { PageID: PageID },
      defaults: {
        SellerID: 15, 
        TemplateName: "default",
        PageUrl: `shop-${PageID}-${Date.now()}`, 
        StoreLogo: "https://www.figma.com/api/mcp/asset/665605e6-519c-4fa0-8070-daa26e795351", 
        IsPublished: false,
        StoreEmail: "", 
        StorePhone: "",
        StoreBankAccount: "", // 💡 預設值也補上
        UpdatedAt: sqlLiteral
      }
    });

    // 2. 修正點：找「店鋪名稱」時，一定要找 ProductID 為 NULL 或者是店鋪標題不為空的那一筆！
    let content = await PageContent.findOne({
      where: { 
        PageID: PageID, 
        LanguageCode: Lang,
        ProductID: null
      }
    });

    // 備用防禦：萬一當初建的時候商品表把 null 寫錯了，我們退回拿該頁面第一筆
    if (!content) {
      content = await PageContent.findOne({
        where: { PageID: PageID, LanguageCode: Lang }
      });
    }

    // 3. 如果真的通通找不到該語言內容，就幫他建一個店鋪模板
    if (!content) {
      content = {
        PageID: PageID,
        LanguageCode: Lang,
        PageTitle: "",
        PageDescription: "",
        ProductID: 26,   
        ProductName: "",       
        CTA_Text: "立即購買",    
        ThemeColor: "冷靜石板",
        ThemeFont: "gothic",    
        UpdatedAt: sqlLiteral
      };
    }

    // 📥 先撈出該 PageID 在 PageProduct 表裡的所有商品紀錄
    const rawPageProducts = await PageProduct.findAll({
      where: { PageID: PageID },
      order: [['DisplayOrder', 'ASC']]
    });

    const PageProductsResult = [];
    for (const pp of rawPageProducts) {
      // 撈商品主表拿到價格、庫存、圖片
      const prodMain = await Product.findOne({ where: { ProductID: pp.ProductID } });
      
      // 撈商品的 PageContent 語系描述 (限定該 ProductID)
      const prodContent = await PageContent.findOne({ 
        where: { PageID: PageID, ProductID: pp.ProductID, LanguageCode: Lang } 
      });

      if (prodMain) {
        PageProductsResult.push({
          PageProductID: pp.PageProductID,
          PageID: pp.PageID,
          ProductID: pp.ProductID,
          DisplayOrder: pp.DisplayOrder,
          isFeatured: pp.isFeatured,
          // 如果 PageContent 裡的商品名稱不存在，就退回拿 Product 主表的
          ProductName: prodContent?.ProductName || prodMain?.ProductName || '未命名商品',
          ProductDescription: prodContent?.ProductDescription || prodMain?.ProductDescription || '',
          Price: prodMain?.Price || 0,
          Stock: prodMain?.Stock || 0,
          ProductImg: prodMain?.ProductImg || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300'
        });
      }
    }

    // 4. 回傳完整格式給前端
    return res.json({
      success: true,
      data: {
        PageTitle: content.PageTitle || "",
        PageDescription: content.PageDescription || "",
        StoreLogo: page.StoreLogo || "https://www.figma.com/api/mcp/asset/665605e6-519c-4fa0-8070-daa26e795351",
        ThemeColor: page.ThemeColor || '冷靜石板',
        ThemeFont: page.ThemeFont || 'gothic',
        StoreEmail: page.StoreEmail || "", 
        StorePhone: page.StorePhone || "",
        StoreBankAccount: page.StoreBankAccount || "", // 💡 實體讀取這裡也要補上！
        PageUrl: page.PageUrl || "", // 🔗 【新增這裡】實體資料庫讀取回傳 PageUrl 給前端初始化
        PageProducts: PageProductsResult
      }
    });

  } catch (err) {
    console.error("讀取或初始化頁面失敗，後端攔截爆錯:", err);
    return res.status(500).json({ success: false, message: "伺服器內部發生錯誤", details: err.message });
  }
  });
  /* ═══════════════════════════════════════════════════════════════
   ★ 消費者前台專用動態 API (從goez-store.html對接 goez-store-template.html)
   動態撈取資料庫，絕不寫死！
═══════════════════════════════════════════════════════════════════ */
// 舊路由：吃數字 ID
router.get('/template/:pageId', async (req, res) => {
  const Mock = await useMock();
  const Lang = req.query.lang || 'zh-TW';
  const param = req.params.pageId;

  // 🛡️ 判斷傳進來的是純數字 ID 還是字串網址 (PageUrl)
  const isNumeric = /^\d+$/.test(param);
  const PageID = isNumeric ? Number(param) : null;
  const PageUrl = !isNumeric ? param : null;

  // 1. 為了防止兩邊主題色名稱對不上有色差，做一個簡單的 CSS 十六進位顏色映射表
  const colorMap = {
        '冷靜石板': {
            '--c-accent': '#64748b',
            '--c-theme-1': '#64748b',
            '--c-theme-2': '#94a3b8',
            '--c-theme-3': '#cbd5e1',
            '--c-theme-4': '#f1f5f9'
        },
        '鼠尾草綠': {
            '--c-accent': '#869489',
            '--c-theme-1': '#869489',
            '--c-theme-2': '#a3ad9e',
            '--c-theme-3': '#c2c9bd',
            '--c-theme-4': '#e8ebe4'
        },
        '陶土橘': {
            '--c-accent': '#b38b7d',
            '--c-theme-1': '#b38b7d',
            '--c-theme-2': '#d1b4a6',
            '--c-theme-3': '#e5d3c8',
            '--c-theme-4': '#f5efea'
        },
        '北歐沙色': {
            '--c-accent': '#a8a29e',
            '--c-theme-1': '#a8a29e',
            '--c-theme-2': '#d6d3d1',
            '--c-theme-3': '#e7e5e4',
            '--c-theme-4': '#f5f5f4'
        }
    };

  // Mock 模式處理
  if (Mock) {
    const { pages, page: template } = readMock('storepage.json');
    // 支援用數字 PageID 或字串 PageUrl 去 Mock 資料裡面找
    const found = (pages || []).find((p) => {
      if (isNumeric) return Number(p.PageID) === PageID;
      return p.PageUrl === PageUrl;
    });
    const base = found || template;
    
    // 🎨 ✅ 統一：Mock 模式只從 StorePage 層級讀取 ThemeColor 和 ThemeFont
    const rawColor = base.ThemeColor || '冷靜石板';
    const rawFont = base.ThemeFont || 'gothic';
    
    return res.json({
      name: base.PageContent?.PageTitle || "Mock 商店",
      tagline: base.PageContent?.PageDescription || "",
      logoUrl: base.StoreLogo || "",
      accentColor: colorMap[rawColor] || '#2b4c7e',
      // 🎨 ✍️ Mock 模式也要回傳 ThemeColor 和 ThemeFont
      ThemeColor: rawColor,
      ThemeFont: rawFont,
      // 👇 【Mock 模式也順便在這裡補上一行】
      SellerID: base.SellerID || 15,
      categories: ['全部', '古著', '磁帶'], // Mock 預設分類
      products: [
        { id: 1, name: '古著襯衫(Mock)', category: '古著', price: 1200, stock: 5, imageUrl: '' },
        { id: 2, name: '復古磁帶(Mock)', category: '磁帶', price: 350, stock: 12, imageUrl: '' }
      ],
      // 🚀 核心修正：Mock 模式的前台聯絡資訊連動
      StoreEmail: base.StoreEmail || "",
      StorePhone: base.StorePhone || "",
      StoreBankAccount: base.StoreBankAccount || "" // 💡 Mock 模式補上銀行帳號
    });
  }

  // 2. 實體資料庫動態查詢 (完全沿用莊組長的防禦與撈取機制)
  try {
    const db = require('../models');
    const { StorePage, PageContent, PageProduct, Product } = db;
    const sqlLiteral = db.sequelize ? db.sequelize.literal('GETDATE()') : new Date();

    let page = null;
    let activePageID = null;

    // 🛡️ 步驟 A：精確判斷數字 ID 還是字串網址，並確保抓到正確的 activePageID
    if (isNumeric) {
      [page] = await StorePage.findOrCreate({
        where: { PageID: PageID },
        defaults: {
          SellerID: 15, 
          TemplateName: "default",
          PageUrl: `shop-${PageID}-${Date.now()}`, 
          StoreLogo: "", 
          IsPublished: false,
          StoreEmail: "", 
          StorePhone: "", 
          StoreBankAccount: "", 
          UpdatedAt: sqlLiteral
        }
      });
      activePageID = page.PageID;
    } else {
      page = await StorePage.findOne({ where: { PageUrl: PageUrl } });
      if (!page) {
        return res.status(404).json({ success: false, message: "找不到該頁面網址" });
      }
      activePageID = page.PageID;
    }

    // 🛡️ 步驟 B：嚴格防禦，若 activePageID 依然為空則直接擋下
    if (!activePageID) {
      return res.status(404).json({ success: false, message: "無法解析有效的 PageID" });
    }

    // 3. 撈取語系內容 (統一使用明確有值的 activePageID)
    let content = await PageContent.findOne({
      where: { PageID: activePageID, LanguageCode: Lang, ProductID: null }
    });

    if (!content) {
      content = await PageContent.findOne({
        where: { PageID: activePageID, LanguageCode: Lang }
      });
    }

    if (!content) {
      // 🛡️ 步驟 C：補齊資料庫規定的非空欄位 (PageID, ProductID, ProductName)
      content = await PageContent.create({
        PageID: activePageID,          // 確保這裡絕對不是 null
        LanguageCode: Lang,
        PageTitle: "", 
        PageDescription: "",
        ProductID: 0,                  // 配合資料庫 NotNull 限制給予預設值
        ProductName: "商店主頁",         // 配合資料庫 NotNull 限制給予預設名稱
        CTA_Text: "立即購買", 
        ThemeColor: "冷靜石板", 
        ThemeFont: "gothic",    
        UpdatedAt: sqlLiteral
      });
    }
    // 動態撈取 PageID 關聯的所有商品
    const rawPageProducts = await PageProduct.findAll({
      where: { PageID: activePageID }, // 💡 確保這裡用 activePageID
      order: [['DisplayOrder', 'ASC']]
    });

    // 3. ★ 重頭戲：動態將資料庫商品欄位，轉譯轉碼為前台格式 (不寫死！)
    const formattedProducts = [];
    
    for (const pp of rawPageProducts) {
      const prodMain = await Product.findOne({ where: { ProductID: pp.ProductID } });
      const prodContent = await PageContent.findOne({ 
        where: { PageID: activePageID, ProductID: pp.ProductID, LanguageCode: Lang } // 💡 確保這裡用 activePageID
      });

      if (prodMain) {
        // 將你原本資料庫的 ProductImg、Price、Stock 欄位映射到前台小寫駝峰
        formattedProducts.push({
          id: pp.ProductID,
          name: prodContent?.ProductName || prodMain?.ProductName || '未命名商品',
          description: prodContent?.ProductDescription || prodMain?.ProductDescription || '',
          category: prodMain?.Category || '熱門商品', // 根據你商品主表欄位動態抓
          price: prodMain?.Price || 0,
          stock: prodMain?.Stock || 0,
          imageUrl: prodMain?.ProductImg || '' // 串到前端的 imageUrl
        });
      }
    }

    // 🎨 ✅ 統一：只從 StorePage 讀取 ThemeColor 和 ThemeFont（不讀取 PageContent）
    const dbThemeColor = page.ThemeColor || '冷靜石板';
    const dbThemeFont = page.ThemeFont || 'gothic';
    const finalAccentColor = colorMap[dbThemeColor] || '#2b4c7e';

    // 4. ★ 吐出前端完全相容的動態資料 JSON
    return res.json({
      // 基本賣場資訊
      name: content.PageTitle || "",
      tagline: content.PageDescription || "",
      logoUrl: page.StoreLogo || "",
      accentColor: finalAccentColor,
      // 🎨 ✍️ 回傳 ThemeColor 和 ThemeFont（只從 StorePage 讀取）
      ThemeColor: dbThemeColor,
      ThemeFont: dbThemeFont,
      // 👇 💡【關鍵修正】把資料庫的 SellerID 帶給前端，才能正確載入優惠券！
      SellerID: page.SellerID || 15,
      
      // 動態從你查出來的商品中，過濾提取出所有不重複的分類作為分類晶片列
      categories: [...new Set(formattedProducts.map(p => p.category))].filter(Boolean),
      products: formattedProducts, // 這邊就是 100% 來自資料庫 page19 的實體商品列表
      // 絕不寫死！動態映射資料庫 StorePage 的實體新欄位
      StoreEmail: page.StoreEmail || "",
      StorePhone: page.StorePhone || "",
      StoreBankAccount: page.StoreBankAccount || "" // 💡 實體資料庫查詢結果補上銀行帳號
    });

  } catch (err) {
    console.error("[Backend Lead] 前台動態路由對接發生錯誤:", err);
    return res.status(500).json({ success: false, message: "伺服器內部發生錯誤", details: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   ★ 新增的專屬文字網址 (Slug) 前台動態路由
   對應網址：GET /store/:slug (例如 /store/sweet-shop)
═══════════════════════════════════════════════════════════════ */
//新路由
router.get('/store/:slug', async (req, res) => {
  const Mock = await useMock();
  const Lang = req.query.lang || 'zh-TW';
  const slug = req.params.slug; // 🔗 抓取網址上的文字代稱

  // 1. 顏色映射表
  const colorMap = {
        '冷靜石板': {
            '--c-accent': '#64748b',
            '--c-theme-1': '#64748b',
            '--c-theme-2': '#94a3b8',
            '--c-theme-3': '#cbd5e1',
            '--c-theme-4': '#f1f5f9'
        },
        '鼠尾草綠': {
            '--c-accent': '#869489',
            '--c-theme-1': '#869489',
            '--c-theme-2': '#a3ad9e',
            '--c-theme-3': '#c2c9bd',
            '--c-theme-4': '#e8ebe4'
        },
        '陶土橘': {
            '--c-accent': '#b38b7d',
            '--c-theme-1': '#b38b7d',
            '--c-theme-2': '#d1b4a6',
            '--c-theme-3': '#e5d3c8',
            '--c-theme-4': '#f5efea'
        },
        '北歐沙色': {
            '--c-accent': '#a8a29e',
            '--c-theme-1': '#a8a29e',
            '--c-theme-2': '#d6d3d1',
            '--c-theme-3': '#e7e5e4',
            '--c-theme-4': '#f5f5f4'
        }
    };

  // Mock 模式處理
  if (Mock) {
    const { pages, page: template } = readMock('storepage.json');
    // 🔗 透過 PageUrl 尋找對應的 Mock 資料
    const found = (pages || []).find((p) => p.PageUrl === slug);
    const base = found || template;
    
    const rawColor = base.ThemeColor || '冷靜石板';
    const rawFont = base.ThemeFont || 'gothic';
    
    return res.json({
      name: base.PageContent?.PageTitle || "Mock 商店",
      tagline: base.PageContent?.PageDescription || "",
      logoUrl: base.StoreLogo || "",
      accentColor: colorMap[rawColor] || '#2b4c7e',
      ThemeColor: rawColor,
      ThemeFont: rawFont,
      SellerID: base.SellerID || 15,
      categories: ['全部', '古著', '磁帶'],
      products: [
        { id: 1, name: '古著襯衫(Mock)', category: '古著', price: 1200, stock: 5, imageUrl: '' },
        { id: 2, name: '復古磁帶(Mock)', category: '磁帶', price: 350, stock: 12, imageUrl: '' }
      ],
      StoreEmail: base.StoreEmail || "",
      StorePhone: base.StorePhone || "",
      StoreBankAccount: base.StoreBankAccount || ""
    });
  }

  // 2. 實體資料庫動態查詢 (透過 PageUrl 尋找)
  try {
    const db = require('../models');
    const { StorePage, PageContent, PageProduct, Product } = db;

    // 🔗 核心差異：用 PageUrl (slug) 去資料庫找出該店家主檔
    const page = await StorePage.findOne({ where: { PageUrl: slug } });
    
    if (!page) {
      return res.status(404).json({ success: false, message: "找不到此賣場專屬網址" });
    }

    const PageID = page.PageID; // 取得該賣場的實際數字 ID

    // 撈取語系內容
    let content = await PageContent.findOne({
      where: { PageID: PageID, LanguageCode: Lang, ProductID: null }
    });

    if (!content) {
      content = await PageContent.findOne({
        where: { PageID: PageID, LanguageCode: Lang }
      });
    }

    if (!content) {
      content = await PageContent.create({
        PageID: PageID, LanguageCode: Lang,
        PageTitle: "", PageDescription: "",
        ProductID: null, CTA_Text: "立即購買", ThemeColor: "冷靜石板", ThemeFont: "gothic",    
        UpdatedAt: new Date()
      });
    }

    // 動態撈取 PageID 關聯的所有商品
    const rawPageProducts = await PageProduct.findAll({
      where: { PageID: PageID },
      order: [['DisplayOrder', 'ASC']]
    });

    const formattedProducts = [];
    
    for (const pp of rawPageProducts) {
      const prodMain = await Product.findOne({ where: { ProductID: pp.ProductID } });
      const prodContent = await PageContent.findOne({ 
        where: { PageID: PageID, ProductID: pp.ProductID, LanguageCode: Lang } 
      });

      if (prodMain) {
        formattedProducts.push({
          id: pp.ProductID,
          name: prodContent?.ProductName || prodMain?.ProductName || '未命名商品',
          description: prodContent?.ProductDescription || prodMain?.ProductDescription || '',
          category: prodMain?.Category || '熱門商品',
          price: prodMain?.Price || 0,
          stock: prodMain?.Stock || 0,
          imageUrl: prodMain?.ProductImg || ''
        });
      }
    }

    const dbThemeColor = page.ThemeColor || '冷靜石板';
    const dbThemeFont = page.ThemeFont || 'gothic';
    const finalAccentColor = colorMap[dbThemeColor] || '#2b4c7e';

    return res.json({
      name: content.PageTitle || "",
      tagline: content.PageDescription || "",
      logoUrl: page.StoreLogo || "",
      accentColor: finalAccentColor,
      ThemeColor: dbThemeColor,
      ThemeFont: dbThemeFont,
      SellerID: page.SellerID || 15,
      categories: [...new Set(formattedProducts.map(p => p.category))].filter(Boolean),
      products: formattedProducts,
      StoreEmail: page.StoreEmail || "",
      StorePhone: page.StorePhone || "",
      StoreBankAccount: page.StoreBankAccount || ""
    });

  } catch (err) {
    console.error("[Backend Slug Route] 專屬網址前台動態路由發生錯誤:", err);
    return res.status(500).json({ success: false, message: "伺服器內部發生錯誤", details: err.message });
  }
});

router.post('/pages/:PageID/update', upload.single('logoUrl'), async (req, res) => {
  console.log('收到 Body內容:', req.body);
  console.log('收到上傳檔案:', req.file); // 👈 可以順便印出來看看有沒有收到檔案
  const Sequelize = require('sequelize'); 
  const { StorePage, PageContent } = require('../models');

  let rawPageID = req.params.PageID;
  let PageID = Number(rawPageID);

  // 🛡️ 防禦機制：如果傳進來的不是數字（例如是 'retro' 這種 slug），自動去資料庫查出真正的數字 PageID
  if (isNaN(PageID)) {
    const foundPage = await StorePage.findOne({ where: { PageUrl: rawPageID } });
    if (foundPage) {
      PageID = foundPage.PageID;
    } else {
      return res.status(404).json({ success: false, message: '找不到對應的賣場代號' });
    }
  }
  
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: '後端沒收到資料，請檢查前端格式' });
  }

  // 🎨 🚀 確保這裡完整接收前端打包帶過來的 themeColor 與 themeFont
  const { isPublished, shopName, shopDesc, logoUrl, themeColor, themeFont, storeEmail, storePhone, storeBankAccount, pageUrl } = req.body || {}; 
  
  // 🚀 關鍵修改：如果有上傳新 Logo 檔案，優先使用 Cloudinary 回傳的網址
  const finalLogoUrl = req.file ? req.file.path : logoUrl;
  
  const Mock = await useMock();

  if (Mock) {
    console.log(`[Mock] 接收到 PageID ${PageID} 的更新請求`);
    
    // 🎨 🚀 Mock 模式儲存：讀取、更新 PageContent 物件、寫回 JSON
    try {
      const mockData = readMock('storepage.json');
      
      const updatePageData = (p) => {
        if (Number(p.PageID) === PageID) {
          p.IsPublished = isPublished ? 1 : 0;
          p.StoreLogo = req.file ? req.file.path : logoUrl;
          // 新增：Mock 模式寫入主表聯絡資訊
          p.StoreEmail = storeEmail || "";
          p.StorePhone = storePhone || "";
          p.StoreBankAccount = storeBankAccount || ""; // 💡 Mock 模式寫入銀行帳號
          // 🎨 ✅ 確保 Mock 模式確實寫入收到的 themeColor 與 themeFont
          p.ThemeColor = themeColor || '冷靜石板';
          p.ThemeFont = themeFont || 'gothic';
          if (!p.PageContent) p.PageContent = {};
          p.PageContent.PageTitle = shopName;
          p.PageContent.PageDescription = shopDesc;
        }
      };

      if (mockData.page) updatePageData(mockData.page);
      if (Array.isArray(mockData.pages)) mockData.pages.forEach(updatePageData);

      // 使用專案既有的機制或直接 fs 寫回
      const mockFilePath = path.join(__dirname, '../src/mocks/storepage.json');
      if (fs.existsSync(mockFilePath)) {
         fs.writeFileSync(mockFilePath, JSON.stringify(mockData, null, 2), 'utf8');
      }
      
      return res.json({ success: true, message: 'Mock 草稿與設計系統儲存成功' });
    } catch (mockErr) {
      console.error('Mock 寫入失敗:', mockErr);
      return res.status(500).json({ success: false, message: 'Mock 寫入失敗' });
    }
  }

  try {
    const { StorePage, PageContent } = require('../models');

    // 1. 更新商店主表 (🎨 🚀 核心：同步把顏色與字體寫進實體 SQL Server！)
    await StorePage.update(
      { 
        IsPublished: isPublished,
        StoreLogo: finalLogoUrl, // 👈 改用這裡
        ThemeColor: themeColor || '冷靜石板', // 📥 直接使用解構出來的變數
        ThemeFont: themeFont || 'gothic',   // 📥 直接使用解構出來的變數
        // 新增：成功將前台傳回的聯絡資訊塞入實體主表！
        StoreEmail: storeEmail || "", 
        StorePhone: storePhone || "",
        StoreBankAccount: storeBankAccount || "", // 💡 成功將前台傳回的銀行帳號塞入實體主表！
        PageUrl: pageUrl || "", // 🔗 【新增這裡】成功將前台傳回的專屬網址存入實體主表！
        UpdatedAt: Sequelize.literal('GETDATE()') 
      },
      { where: { PageID: PageID } }
    );

    // 2. 更新商店內容（加上 ProductID: null 與 LanguageCode 限制，避免誤改商品資料）
await PageContent.update(
  { 
    PageTitle: shopName,
    PageDescription: shopDesc,
    UpdatedAt: Sequelize.literal('GETDATE()')
  },
  { 
    where: { 
      PageID: PageID,
      ProductID: null,         // 確保只修改商店主頁，不改到商品
      LanguageCode: Lang       // 確保只修改當前編輯的語系
    } 
  }
);

    return res.json({ success: true, message: isPublished ? '賣場已正式發布！' : '草稿儲存成功！' });
  } catch (err) {
    console.error('資料庫更新失敗:', err); 
    return res.status(500).json({ success: false, message: '伺服器寫入失敗' });
  }
});


router.post('/create-new-shop', async (req, res) => {
  try {
    const Sequelize = require('sequelize'); 
    const { StorePage } = require('../models');

    const newPage = await StorePage.create({
      SellerID: 15,          
      TemplateName: "Default", 
      PageUrl: `shop-${Date.now()}`, 
      StoreLogo: "",
      IsPublished: false,
      UpdatedAt: Sequelize.literal('GETDATE()') 
    });

    res.json({ success: true, pageId: newPage.PageID });

  } catch (err) {
    console.error('建立新賣場失敗:', err);
    res.status(500).json({ success: false, message: "無法建立新賣場" });
  }
});

console.log("✅ store.js 路由檔案已成功載入");

/* ═══════════════════════════════════════════════════════════════
   ★ 新增：取得指定賣家的所有賣場清單 (供 mystores-management.html 使用)
═══════════════════════════════════════════════════════════════ */
router.get('/my-stores', async (req, res) => {
  const Mock = await useMock();
  const sellerId = req.query.sellerId || 15; // 預設帶 15

  if (Mock) {
    // Mock 模式回傳假資料
    return res.json({
      success: true,
      stores: [
        {
          id: 19,
          name: '北歐特色小店 (Mock)',
          status: 'published',
          createdAt: '2026-05-14'
        },
        {
          id: 26,
          name: '陶土橘風格店 (Mock)',
          status: 'draft',
          createdAt: '2026-07-24'
        }
      ]
    });
  }

  try {
    const { StorePage, PageContent } = require('../models');

    // 1. 根據 SellerID 撈出該賣家的所有 StorePage
    const pages = await StorePage.findAll({
      where: { SellerID: sellerId },
      order: [['CreatedAt', 'DESC']]
    });

    // 2. 為了把店名（PageTitle）也一併帶出來，我們需要去 PageContent 撈對應的主標題
    const storesResult = [];
    for (const page of pages) {
      // 找該 PageID 的店鋪標題 (ProductID 為 null 或對應主頁的內容)
      let content = await PageContent.findOne({
        where: { PageID: page.PageID, ProductID: null }
      });
      if (!content) {
        content = await PageContent.findOne({
          where: { PageID: page.PageID }
        });
      }

      storesResult.push({
        id: page.PageID,
        name: content?.PageTitle || `未命名賣場 (${page.PageID})`,
        // 將資料庫的 IsPublished (true/false) 轉成前端需要的字串狀態
        status: page.IsPublished ? 'published' : 'draft',
        // 格式化日期 (只取 YYYY-MM-DD 或保留完整字串)
        createdAt: page.CreatedAt ? page.CreatedAt.toISOString().split('T')[0] : '',
        customUrl: page.PageUrl || '' // <-- 這裡對應資料庫真實欄位 PageUrl！
      });
    }

    return res.json({
      success: true,
      stores: storesResult
    });

  } catch (err) {
    console.error('[Backend Error] 撈取賣家賣場清單失敗:', err);
    return res.status(500).json({ success: false, message: '伺服器內部發生錯誤' });
  }
});
/* ═══════════════════════════════════════════════════════════════
   ★ 新增：刪除指定賣場的 API (同步刪除 StorePage、PageContent、PageProduct)
═══════════════════════════════════════════════════════════════ */
router.delete('/pages/:PageID', async (req, res) => {
  const Mock = await useMock();
  const PageID = Number(req.params.PageID);

  if (Mock) {
    // Mock 模式簡單回傳成功
    return res.json({ success: true, message: 'Mock 模式刪除成功' });
  }

  try {
    const { StorePage, PageContent, PageProduct } = require('../models');

    // 1. 為了保持資料庫乾淨，建議一併刪除關聯的 PageProduct 與 PageContent
    await PageProduct.destroy({ where: { PageID: PageID } });
    await PageContent.destroy({ where: { PageID: PageID } });

    // 2. 刪除 StorePage 主檔
    const deletedCount = await StorePage.destroy({ where: { PageID: PageID } });

    if (deletedCount === 0) {
      return res.status(404).json({ success: false, message: '找不到該賣場' });
    }

    return res.json({ success: true, message: '賣場刪除成功！' });
  } catch (err) {
    console.error('[Backend Error] 刪除賣場失敗:', err);
    return res.status(500).json({ success: false, message: '伺服器內部發生錯誤，刪除失敗' });
  }
});
module.exports = router;
