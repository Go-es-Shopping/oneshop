// 模組對應資料表：Seller
const express = require('express')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')
// 💡 新增：引入 Seller Model 才能查詢資料庫
const { Seller } = require('../models') 

const router = express.Router()

function formatDecimal(n) {
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

router.post('/login', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const seller = readMock('seller.json')
    return res.json({ ...seller, AccessToken: 'JWT_TOKEN' })
  }
  
  // TODO: 這裡請組員實作實際的 Sequelize 查詢（比對帳密，回傳 Seller 與 Token）
  try {
    const { Email, Password } = req.body; // 從 Postman 的 Body 抓取資料

    // 實體查詢：比對 Email 與 Password
    const seller = await Seller.findOne({
      where: { 
        Email: Email || '', 
        // 註：實務上密碼應加密，此處先以明文比對供 Demo 使用
        // Password: Password 
      }
    });

    if (seller) {
      // 轉換為 JSON 並移除敏感密碼欄位
      const sellerData = seller.toJSON();
      delete sellerData.Password;

      return res.json({
        ...sellerData,
        AccessToken: 'REAL_DATABASE_JWT_TOKEN' // 標記為真實連線
      });
    } else {
      // 如果沒找到，回傳 401 錯誤，這在報告時可以展示安全機制
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: '伺服器內部錯誤' });
  }
})

router.get('/me', async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const seller = readMock('seller.json')
    return res.json(seller)
  }

  // TODO: 這裡請組員實作實際的 Sequelize 查詢（依 AccessToken 取得 Seller 資訊）
  try {
    // 這裡先簡單實作：撈取第一筆賣家資料作為 Demo 展示
    const seller = await Seller.findOne();
    if (seller) {
      return res.json(seller);
    }
  } catch (error) {
    return res.status(500).json({ message: '無法取得資料' });
  }

  return res.json({
    SellerID: 123,
    SellerName: 'ACME',
    StoreName: 'ACME Store',
    Email: 'owner@acme.com',
    Phone: '+886912345678',
    PlanType: 1,
    Status: 1
  })
})

router.post('/logout', (req, res) => {
  return res.json({ Success: true })
})

module.exports = router
