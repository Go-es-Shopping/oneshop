const Coupon = require('../models/Coupon'); // 依你的 Coupon Model 路徑調整

// 1. 取得所有優惠券列表
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
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
      Title, Code, DiscountType, MinSpend, 
      UsageLimit, TotalQuantity, IsExclusive, StartDate, EndDate 
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

    // 建立新優惠券
    const newCoupon = await Coupon.create({
      Title,
      Code,
      DiscountType,
      MinSpend: MinSpend || null,
      UsageLimit: UsageLimit || null,
      TotalQuantity: TotalQuantity || null,
      IsExclusive: IsExclusive || false,
      StartDate: StartDate || null,
      EndDate: EndDate || null
    });

    res.status(201).json({ success: true, message: '優惠券建立成功', data: newCoupon });
  } catch (error) {
    console.error('新增優惠券失敗:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// 3. 刪除優惠券
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);
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