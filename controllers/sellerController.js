const sequelize = require('../config/database')
const Seller = require('../models/Seller')
const { readMock } = require('../src/mocks/utils')

async function useMock() {
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
  const mock = await useMock()
  if (mock) {
    const seller = readMock('seller.json')
    return res.json({ ...seller, AccessToken: 'JWT_TOKEN' })
  }
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: '缺少必填欄位' })
  }
  const seller = await Seller.findOne({ where: { Email: email } }).catch(() => null)
  if (!seller || password !== '123456') {
    return res.status(401).json({ message: '登入失敗，帳號或密碼錯誤' })
  }
  return res.json({ ...shapeSeller(seller), AccessToken: 'JWT_TOKEN' })
}

exports.getProfile = async (req, res) => {
  const mock = await useMock()
  if (mock) {
    const seller = readMock('seller.json')
    return res.json(seller)
  }
  const email = req.query.Email || req.body?.Email
  if (!email) {
    return res.status(400).json({ message: '缺少查詢條件' })
  }
  const seller = await Seller.findOne({ where: { Email: email } }).catch(() => null)
  if (!seller) {
    return res.status(404).json({ message: '查無資料' })
  }
  return res.json(shapeSeller(seller))
}
