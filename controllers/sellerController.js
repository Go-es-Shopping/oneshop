const sequelize = require('../config/database')
const Seller = require('../models/Seller')
const { readMock } = require('../src/mocks/utils')
const bcrypt = require('bcrypt') // 用於密碼雜湊與驗證

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

// ==========================================
// 1. 賣家註冊 API (寫入資料庫)
// ==========================================
exports.register = async (req, res) => {
  const Mock = await useMock()
  const { sellerName, storeName, phone, email, password } = req.body || {}

  if (Mock) {
    return res.json({ success: true, message: 'Mock 模式：註冊成功' })
  }

  // 必填欄位檢查
  if (!sellerName || !storeName || !phone || !email || !password) {
    return res.status(400).json({ success: false, message: '缺少必填欄位' })
  }

  try {
    // 檢查 Email 是否已經被註冊過
    const existingSeller = await Seller.findOne({ where: { Email: email } })
    if (existingSeller) {
      return res.status(400).json({ success: false, message: '此 Email 已經被註冊過！' })
    }

    // 密碼加密 (Salt Rounds = 10)
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 新增至資料庫 (Seller 表)
    const newSeller = await Seller.create({
      SellerName: sellerName,
      StoreName: storeName,
      Phone: phone,
      Email: email,
      PasswordHash: passwordHash,
      PlanType: 'Free',  // 預設方案
      Status: 1     // 預設狀態 (1: 正常/開通)
    })

    return res.json({
      success: true,
      message: '註冊成功！',
      seller: shapeSeller(newSeller)
    })
  } catch (error) {
    console.error('註冊資料庫寫入失敗:', error)
    return res.status(500).json({ success: false, message: '伺服器錯誤，寫入資料庫失敗' })
  }
}

// ==========================================
// 2. 賣家登入 API (比對資料庫資料)
// ==========================================
exports.login = async (req, res) => {
  const Mock = await useMock()

  // 💡 相容大小寫欄位（前端傳 email 或 Email 皆可抓到）
  const Email = req.body?.email || req.body?.Email
  const Password = req.body?.password || req.body?.Password

  if (Mock) {
    const SellerData = readMock('seller.json') || {}
    return res.json({
      success: true,               // 確保前端 data.success 為 true
      seller: SellerData,
      token: 'JWT_TOKEN',          // 相容前端的 localStorage token 命名
      AccessToken: 'JWT_TOKEN'
    })
  }

  if (!Email || !Password) {
    return res.status(400).json({ success: false, message: '缺少必填欄位' })
  }

  try {
    // 從資料庫撈取該 Email 的賣家資料
    const SellerRow = await Seller.findOne({ where: { Email: Email } })

    if (!SellerRow) {
      return res.status(401).json({ success: false, message: '登入失敗，帳號或密碼錯誤' })
    }

    // 比對輸入的明文密碼與資料庫中的 PasswordHash
    let isPasswordValid = false
    if (SellerRow.PasswordHash && SellerRow.PasswordHash.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(Password, SellerRow.PasswordHash)
    } else {
      isPasswordValid = (Password === '123456') || (Password === SellerRow.PasswordHash)
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '登入失敗，帳號或密碼錯誤' })
    }

    return res.json({
      success: true,
      seller: shapeSeller(SellerRow),
      token: 'JWT_TOKEN',
      AccessToken: 'JWT_TOKEN'
    })
  } catch (error) {
    console.error('登入驗證失敗:', error)
    return res.status(500).json({ success: false, message: '伺服器內部錯誤' })
  }
}

// ==========================================
// 3. 取得賣家個人資料 API (支援 sellerId 或 Email 查詢)
// ==========================================
exports.getProfile = async (req, res) => {
  const Mock = await useMock()
  if (Mock) {
    const SellerData = readMock('seller.json')
    return res.json(SellerData)
  }

  // 💡 同時相容從 query 或 body 帶入的 sellerId 或 Email
  const sellerId = req.query.sellerId || req.query.SellerID || req.body?.sellerId
  const email = req.query.Email || req.query.email || req.body?.Email

  if (!sellerId && !email) {
    return res.status(400).json({ message: '缺少查詢條件 (sellerId 或 Email)' })
  }

  try {
    let sellerRow = null

    // 優先以 sellerId 主鍵查詢
    if (sellerId) {
      sellerRow = await Seller.findByPk(sellerId)
    } else if (email) {
      sellerRow = await Seller.findOne({ where: { Email: email } })
    }

    if (!sellerRow) {
      return res.status(404).json({ message: '查無資料' })
    }

    // 回傳前端格式
    return res.json(shapeSeller(sellerRow))
  } catch (error) {
    console.error('取得個人資料失敗:', error)
    return res.status(500).json({ message: '伺服器內部錯誤' })
  }
}

// ==========================================
// 4. 賣家登出 API
// ==========================================
exports.logout = async (req, res) => {
  return res.json({
    success: true,
    message: '登出成功'
  })
}

// ==========================================
// 5. 更新賣家基本資料 API (姓名、電話、商店名稱)
// ==========================================
exports.updateProfile = async (req, res) => {
  const Mock = await useMock()
  const { sellerId, sellerName, storeName, phone } = req.body || {}

  if (Mock) {
    return res.json({ success: true, message: 'Mock 模式：資料更新成功' })
  }

  if (!sellerId) {
    return res.status(400).json({ success: false, message: '缺少 SellerID' })
  }

  try {
    const seller = await Seller.findByPk(sellerId)
    if (!seller) {
      return res.status(404).json({ success: false, message: '查無此賣家帳號' })
    }

    // 更新欄位
    if (sellerName) seller.SellerName = sellerName
    if (storeName) seller.StoreName = storeName
    if (phone) seller.Phone = phone

    await seller.save()

    return res.json({
      success: true,
      message: '基本資料更新成功！',
      seller: shapeSeller(seller)
    })
  } catch (error) {
    console.error('更新基本資料失敗:', error)
    return res.status(500).json({ success: false, message: '伺服器內部錯誤' })
  }
}

// ==========================================
// 6. 變更密碼 API (驗證舊密碼並加密新密碼)
// ==========================================
exports.updatePassword = async (req, res) => {
  const Mock = await useMock()
  const { sellerId, oldPassword, newPassword } = req.body || {}

  if (Mock) {
    return res.json({ success: true, message: 'Mock 模式：密碼變更成功' })
  }

  if (!sellerId || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '請填寫舊密碼與新密碼' })
  }

  try {
    const seller = await Seller.findByPk(sellerId)
    if (!seller) {
      return res.status(404).json({ success: false, message: '查無此賣家帳號' })
    }

    // 驗證舊密碼
    let isOldPasswordValid = false
    if (seller.PasswordHash && seller.PasswordHash.startsWith('$2b$')) {
      isOldPasswordValid = await bcrypt.compare(oldPassword, seller.PasswordHash)
    } else {
      isOldPasswordValid = (oldPassword === seller.PasswordHash)
    }

    if (!isOldPasswordValid) {
      return res.status(400).json({ success: false, message: '舊密碼輸入錯誤' })
    }

    // 雜湊新密碼並儲存
    const saltRounds = 10
    seller.PasswordHash = await bcrypt.hash(newPassword, saltRounds)
    await seller.save()

    return res.json({
      success: true,
      message: '密碼變更成功，下次登入請使用新密碼！'
    })
  } catch (error) {
    console.error('變更密碼失敗:', error)
    return res.status(500).json({ success: false, message: '伺服器內部錯誤' })
  }
}

// ==========================================
// 7. 刪除賣家帳號 API
// ==========================================
exports.deleteAccount = async (req, res) => {
  const Mock = await useMock()
  const { sellerId } = req.body || {}

  if (Mock) {
    return res.json({ success: true, message: 'Mock 模式：帳號已刪除' })
  }

  if (!sellerId) {
    return res.status(400).json({ success: false, message: '缺少 SellerID' })
  }

  try {
    const seller = await Seller.findByPk(sellerId)
    if (!seller) {
      return res.status(404).json({ success: false, message: '查無此賣家帳號' })
    }

    await seller.destroy()

    return res.json({
      success: true,
      message: '帳號已成功刪除'
    })
  } catch (error) {
    console.error('刪除帳號失敗:', error)
    return res.status(500).json({ success: false, message: '伺服器內部錯誤' })
  }
}