const sequelize = require('../config/database')
const PlatformAdmin = require('../models/PlatformAdmin')
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

function shapeAdmin(a) {
  return {
    AdminID: a.AdminID,
    AdminName: a.AdminName,
    Email: a.Email,
    Role: a.Role
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body || {}
  
  // 1. 先檢查必填欄位 (無論是否為 Mock 都要檢查)
  if (!email || !password) {
    return res.status(400).json({ message: '缺少必填欄位' })
  }

  const mock = await useMock()
  
  // 2. 處理 Mock 邏輯
  if (mock) {
    // 檢查密碼是否正確 (Mock 測試用)
    if (password !== '123456') {
      return res.status(401).json({ message: '登入失敗，帳號或密碼錯誤 (Mock)' })
    }
    const admin = readMock('admin.json')
    return res.json({ ...admin, AccessToken: 'JWT_TOKEN' })
  }

  // 3. 處理真實資料庫邏輯 (非 Mock)
  const admin = await PlatformAdmin.findOne({ where: { Email: email } }).catch(() => null)
  if (!admin || password !== '123456') {
    return res.status(401).json({ message: '登入失敗，帳號或密碼錯誤' })
  }
  return res.json({ ...shapeAdmin(admin), AccessToken: 'JWT_TOKEN' })
}
