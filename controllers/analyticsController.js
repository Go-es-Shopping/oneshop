const { PageVisit, Order } = require('../models/index');
const sequelize = require('../config/database');

/**
 * 模擬判定邏輯
 */
async function useMock() {
  if (process.env.FORCE_MOCK === 'true') return true;
  try {
    await sequelize.authenticate();
    return false;
  } catch {
    return true;
  }
}

/**
 * 紀錄瀏覽次數 (POST /api/track/view)
 */
exports.trackView = async (req, res) => {
  const { productId, pageType, referrer } = req.body || {};
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  const isMock = await useMock();

  if (isMock) {
    console.log('🧪 [Mock Track View]:', { productId, pageType, referrer, ipAddress });
    return res.status(201).json({ message: '瀏覽紀錄已存入 (Mock)', status: 'success' });
  }

  try {
    await PageVisit.create({
      ProductID: productId || null,
      PageType: pageType || 'Unknown',
      Referrer: referrer || null,
      IPAddress: ipAddress
    });
    return res.status(201).json({ status: 'success' });
  } catch (error) {
    console.error('Track View error:', error);
    return res.status(500).json({ message: '無法存入瀏覽紀錄', error: error.message });
  }
};

/**
 * 轉換率統計邏輯 (GET /api/admin/analytics)
 */
exports.getAnalytics = async (req, res) => {
  const isMock = await useMock();

  if (isMock) {
    return res.json({
      totalVisits: 1500,
      completedOrders: 45,
      conversionRate: '3.00%',
      utmStats: [
        { utm_source: 'Facebook', orderCount: 20 },
        { utm_source: 'Google', orderCount: 15 },
        { utm_source: 'Direct', orderCount: 10 }
      ],
      mode: 'Mock'
    });
  }

  try {
    const totalVisits = await PageVisit.count();
    const completedOrders = await Order.count({
      where: { OrderStatus: '4' } // 假設 '4' 為完成取貨/已完成
    });

    const conversionRate = totalVisits > 0 
      ? ((completedOrders / totalVisits) * 100).toFixed(2) + '%' 
      : '0.00%';

    // 額外：按來源統計訂單
    const utmStats = await Order.findAll({
      attributes: [
        [sequelize.col('UTM_Source'), 'utm_source'],
        [sequelize.fn('COUNT', sequelize.col('OrderID')), 'orderCount']
      ],
      group: ['UTM_Source']
    });

    return res.json({
      totalVisits,
      completedOrders,
      conversionRate,
      utmStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ message: '統計資料獲取失敗', error: error.message });
  }
};
