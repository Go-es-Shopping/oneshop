const sequelize = require('../config/database')
const Seller = require('../models/Seller')
const { readMock } = require('../src/mocks/utils')

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

function shapeSeller(s) {
  return {
    SellerID: s.SellerID,
    SellerName: s.SellerName,
    StoreName: s.StoreName,
    Email: s.Email,
    Phone: s.Phone,
    PlanType: s.PlanType,
    Status: s.Status
  }
}

exports.login = async (req, res) => {
  const Mock = await useMock()
  const { Email, Password } = req.body || {}
  
  if (Mock) {
    const SellerData = readMock('seller.json')
    return res.json({ ...SellerData, AccessToken: 'JWT_TOKEN' })
  }

  if (!Email || !Password) {
    return res.status(400).json({ message: '缺少必填欄位' })
  }

  const SellerRow = await Seller.findOne({ where: { Email: Email } }).catch(() => null)
  if (!SellerRow || Password !== '123456') {
    return res.status(401).json({ message: '登入失敗，帳號或密碼錯誤' })
  }
  return res.json({ ...shapeSeller(SellerRow), AccessToken: 'JWT_TOKEN' })
}

exports.getProfile = async (req, res) => {
  const Mock = await useMock()
  if (Mock) {
    const SellerData = readMock('seller.json')
    return res.json(SellerData)
  }
  const Email = req.query.Email || req.body?.Email
  if (!Email) {
    return res.status(400).json({ message: '缺少查詢條件' })
  }
  const SellerRow = await Seller.findOne({ where: { Email: Email } }).catch(() => null)
  if (!SellerRow) {
    return res.status(404).json({ message: '查無資料' })
  }
  return res.json(shapeSeller(SellerRow))
}
