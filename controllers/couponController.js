const Coupon = require('../models/Coupon'); // 依你的 Coupon Model 路徑調整

// 1. 取得優惠券列表 (支援用 sellerID 篩選特定賣家)
exports.getCoupons = async (req, res) => {
  try {
    // 取得前端傳來的 query 參數 (例如 /api/coupons?sellerID=1)
    const { sellerID } = req.query;

    // 動態組合查詢條件：如果有帶 sellerID 就進行篩選，沒有就撈全部 (或依需求調整)
    const whereCondition = sellerID ? { SellerID: sellerID } : {};

    const coupons = await Coupon.findAll({
      where: whereCondition,
      order: [['CreatedAt', 'DESC']] // 依照建立時間新到舊排序
    });
    
    res.json({ success: true, list: coupons });
  } catch (error) {
    console.error('取得優惠券失敗:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// 2. 新增優惠券
exports.createCoupon = async (req, res) => {
  try {
    const { 
      Title, Code, DiscountType, 
      UsageLimit, TotalQuantity, IsExclusive, StartDate, EndDate, Rules 
    } = req.body;

    // 檢查必填欄位
    if (!Title || !Code || !DiscountType) {
      return res.status(400).json({ success: false, message: '請填寫必要欄位（名稱、代碼、折扣種類）' });
    }

    // 檢查代碼是否重複
    const existingCoupon = await Coupon.findOne({ where: { Code } });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: '此優惠券代碼已經存在' });
    }

    // 從前端傳來的 Rules 陣列取得動態規則的數值（若有填寫則取第一筆）
    let minSpendValue = null;
    let discountValue = null;

    if (Rules && Array.isArray(Rules) && Rules.length > 0) {
      console.log('接收到的優惠券階梯規則:', Rules);
      minSpendValue = Rules[0].minSpend !== undefined ? Rules[0].minSpend : null;
      discountValue = Rules[0].discountValue !== undefined ? Rules[0].discountValue : null;
    }

    // 建立新優惠券並寫入 MinSpend 與 DiscountValue
    const newCoupon = await Coupon.create({
      Title,
      Code,
      DiscountType,
      MinSpend: minSpendValue,
      DiscountValue: discountValue,
      UsageLimit: UsageLimit || null,
      TotalQuantity: TotalQuantity || null,
      IsExclusive: IsExclusive || false,
      StartDate: StartDate || null,
      EndDate: EndDate || null
    });

    res.status(201).json({ success: true, message: '優惠券建立成功', data: newCoupon });
  } catch (error) {
    console.error('新增優惠券失敗:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤: ' + error.message });
  }
};

// 3. 刪除優惠券
exports.deleteCoupon = async (req, res) => {
  try {
    const { CouponID } = req.params;

    const coupon = await Coupon.findByPk(CouponID);
    if (!coupon) {
      return res.status(404).json({ success: false, message: '找不到此優惠券' });
    }

    await coupon.destroy();
    res.json({ success: true, message: '優惠券刪除成功' });
  } catch (error) {
    console.error('刪除優惠券失敗:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};
// 4. 驗證並套用優惠券 (給結帳頁使用)
exports.applyCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    // 檢查有沒有輸入代碼
    if (!code) {
      return res.status(400).json({ success: false, message: '請輸入優惠券代碼' });
    }

    // 尋找資料庫中的優惠券
    const coupon = await Coupon.findOne({ where: { Code: code } });
    if (!coupon) {
      return res.status(404).json({ success: false, message: '找不到此優惠券代碼' });
    }

    // 檢查低消門檻 (MinSpend)
    const currentTotal = orderTotal || 0;
    if (coupon.MinSpend && currentTotal < coupon.MinSpend) {
      return res.status(400).json({ 
        success: false, 
        message: `未達此優惠券的使用門檻（最低消費 NT$ ${coupon.MinSpend}）` 
      });
    }

    // 檢查日期是否過期 (StartDate / EndDate)
    const now = new Date();
    if (coupon.StartDate && new Date(coupon.StartDate) > now) {
      return res.status(400).json({ success: false, message: '此優惠券尚未開始使用' });
    }
    if (coupon.EndDate && new Date(coupon.EndDate) < now) {
      return res.status(400).json({ success: false, message: '此優惠券已過期' });
    }

    // 計算實際折抵金額
    let discountAmount = 0;
    if (coupon.DiscountType === 'percentage') { // 假設你的百分比打折型態叫 percentage
      // 例如 DiscountValue 是 10 代表打 9 折或折 10%，看你們系統設計，這裡以固定金額或比例為例
      // 這裡先對應你資料庫存的 DiscountValue 數值
      discountAmount = Math.round(currentTotal * (coupon.DiscountValue / 100));
    } else {
      // 現金折抵（例如直接折 100 元）
      discountAmount = coupon.DiscountValue || 0;
    }

    // 確保折扣金額不會大於總金額
    if (discountAmount > currentTotal) {
      discountAmount = currentTotal;
    }

    // 回傳成功結果給前端結帳頁
    res.json({
      success: true,
      message: '優惠券套用成功！',
      data: {
        couponID: coupon.CouponID,
        couponCode: coupon.Code,
        discountValue: discountAmount // 實際折掉的金額
      }
    });

  } catch (error) {
    console.error('套用優惠券失敗:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤: ' + error.message });
  }
};