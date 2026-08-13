/**
 * ==============================================================================
 * 【藍新金流 (NewebPay) 加解密工具包】
 * 
 * 檔案用途：
 * 1. 負責將結帳資料進行 AES-256-CBC 加密，打包後送給藍新金流。
 * 2. 負責將藍新回傳的加密資料進行解密，以便讀取付款結果。
 * 3. 產生 SHA256 檢查碼 (CheckValue/TradeSha)，確保資料在傳輸過程中未被竄改。
 * 
 * 核心參數依賴：
 * 必須在 .env 檔案中設定好 MERCHANT_ID、HASH_KEY 與 HASH_IV。
 * ==============================================================================
 */

const crypto = require('crypto');

// 1. AES 加密 (將送往藍新的物件資料轉為 Query String 格式並進行加密)
function createAesEncrypt(tradeInfoObj) {
  const data = Object.keys(tradeInfoObj)
    .map(key => `${key}=${tradeInfoObj[key]}`)
    .join('&');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', process.env.HASH_KEY, process.env.HASH_IV);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// 2. AES 解密 (用來接收並還原藍新幕後通知 NotifyUrl 或 ReturnUrl 回傳的 TradeInfo)
function createAesDecrypt(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.HASH_KEY, process.env.HASH_IV);
  decipher.setAutoPadding(true);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 3. SHA256 檢查碼 (將 加密後的TradeInfo 搭配 HashKey 與 HashIV 產生 TradeSha 驗證碼)
function createSha256Encrypt(tradeInfo) {
  const hash = crypto.createHash('sha256');
  const data = `HashKey=${process.env.HASH_KEY}&${tradeInfo}&HashIV=${process.env.HASH_IV}`;
  return hash.update(data).digest('hex').toUpperCase();
}

module.exports = {
  createAesEncrypt,
  createAesDecrypt,
  createSha256Encrypt
};