const sequelize = require('../config/database')
const PlatformAdmin = require('../models/PlatformAdmin')
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

function shapeAdmin(a) {
  return {
    AdminID: a.AdminID,
    AdminName: a.AdminName,
    Email: a.Email,
    Role: a.Role
  }
}

exports.login = async (req, res) => {
  const { Email, Password } = req.body || {}
  
  // 1. 先檢查必填欄位 (無論是否為 Mock 都要檢查)
  if (!Email || !Password) {
    return res.status(400).json({ message: '缺少必填欄位' })
  }

  const Mock = await useMock()
  
  // 2. 處理 Mock 邏輯
  if (Mock) {
    // 檢查密碼是否正確 (Mock 測試用)
    if (Password !== '123456') {
      return res.status(401).json({ message: '登入失敗，帳號或密碼錯誤 (Mock)' })
    }
    const AdminData = readMock('admin.json')
    return res.json({ ...AdminData, AccessToken: 'JWT_TOKEN' })
  }

  // 3. 處理真實資料庫邏輯 (非 Mock)
  const AdminRow = await PlatformAdmin.findOne({ where: { Email: Email } }).catch(() => null)
  if (!AdminRow || Password !== '123456') {
    return res.status(401).json({ message: '登入失敗，帳號或密碼錯誤' })
  }
  return res.json({ ...shapeAdmin(AdminRow), AccessToken: 'JWT_TOKEN' })
}
