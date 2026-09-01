const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController'); // 依你的 controller 路徑調整

// 1. 取得優惠券列表 (GET /api/coupons)
router.get('/', couponController.getCoupons);

// 2. 新增優惠券 (POST /api/coupons)
router.post('/', couponController.createCoupon);

// 3. 更新優惠券 (PUT /api/coupons/:CouponID) —— 補上編輯路由
router.put('/:CouponID', couponController.updateCoupon);

// 4. 刪除優惠券 (DELETE /api/coupons/:CouponID) —— 順便把刪除也寫進去
router.delete('/:CouponID', couponController.deleteCoupon);

// 5. 驗證並套用優惠券 (POST /api/coupons/apply)
router.post('/apply', couponController.applyCoupon);

module.exports = router;