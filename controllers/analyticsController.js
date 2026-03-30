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
  const body = req.body || {};
  // 同步支援 PascalCase 與 camelCase
  const ProductID = body.ProductID !== undefined ? body.ProductID : body.productId;
  const PageType = body.PageType !== undefined ? body.PageType : body.pageType;
  const Referrer = body.Referrer !== undefined ? body.Referrer : body.referrer;
  const SessionID = body.SessionID !== undefined ? body.SessionID : body.sessionId;
  const Metadata = body.Metadata !== undefined ? body.Metadata : body.metadata;
  const IPAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const UserAgent = req.headers['user-agent'] || null;

  const isMock = await useMock();

  if (isMock) {
    console.log('🧪 [Mock Track View]:', { ProductID, PageType, Referrer, IPAddress, SessionID, Metadata });
    return res.status(201).json({ message: '瀏覽紀錄已存入 (Mock)', status: 'success' });
  }

  try {
    await PageVisit.create({
      ProductID: ProductID || null,
      PageType: PageType || 'Unknown',
      Referrer: Referrer || null,
      IPAddress: IPAddress,
      UserAgent: UserAgent,
      SessionID: SessionID || null,
      Metadata: Metadata ? JSON.stringify(Metadata) : null
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
      TotalVisits: 1500,
      CompletedOrders: 45,
      ConversionRate: '3.00%',
      UTMStats: [
        { UTM_Source: 'Facebook', OrderCount: 20 },
        { UTM_Source: 'Google', OrderCount: 15 },
        { UTM_Source: 'Direct', OrderCount: 10 }
      ],
      Mode: 'Mock'
    });
  }

  try {
    const TotalVisits = await PageVisit.count();
    const CompletedOrders = await Order.count({
      where: { OrderStatus: '4' } // 假設 '4' 為完成取貨/已完成
    });

    const ConversionRate = TotalVisits > 0 
      ? ((CompletedOrders / TotalVisits) * 100).toFixed(2) + '%' 
      : '0.00%';

    // 額外：按來源統計訂單
    const UTMStats = await Order.findAll({
      attributes: [
        [sequelize.col('UTM_Source'), 'UTM_Source'],
        [sequelize.fn('COUNT', sequelize.col('OrderID')), 'OrderCount']
      ],
      group: ['UTM_Source']
    });

    return res.json({
      TotalVisits,
      CompletedOrders,
      ConversionRate,
      UTMStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ message: '統計資料獲取失敗', error: error.message });
  }
};
