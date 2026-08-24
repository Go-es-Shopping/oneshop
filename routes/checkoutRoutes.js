const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// 1. 購物車金額計算 API
router.post('/calculate', checkoutController.calculate);

// 2. 結帳並建立訂單 API (POST /api/checkout 或對應的路徑)
router.post('/', checkoutController.checkout);

// 3. 如果賣家有專屬網址（例如 /store/retro），藍新用 POST 送回來時走這裡
router.post('/store/:slug', (req, res) => {
  const { slug } = req.params;
  // 導回原本的專屬賣場，並帶上付款結果參數
  return res.redirect(`/store/${slug}?payment=result`);
});

// 4. 如果賣家是用傳統網址（/goez-store-template.html），藍新用 POST 送回來時走這裡
// 注意：前端路由如果是打 /goez-store-template.html，我們可以在後端這樣接：
router.post('/goez-store-template.html', (req, res) => {
  // 從 query 或 body 抓回原本的 pageId，預設帶 19
  const pageId = req.query.pageId || req.body.PageID || 19;
  return res.redirect(`/goez-store-template.html?pageId=${pageId}&payment=result`);
});

module.exports = router;
