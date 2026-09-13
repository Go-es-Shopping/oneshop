// 模組對應資料表：Order, Orderdetail, Product, PageContent, PageVisit
// 對應頁面：goez-shop-sales-analytics.html（銷售成效追蹤）

const express = require('express')
const { Op, literal } = require('sequelize')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')

const router = express.Router()

const PAID_PAYMENT_STATUS = 1
const CANCELLED_ORDER_STATUS = '5'
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 }

/**
 * 將前端傳來的語系統一轉成專案對應代碼
 * 前端可能帶 'zh-Hant' / 'zh-TW' / 'en' / 'ja'
 */
function resolveLang(raw) {
  if (!raw) return 'zh-TW'
  const l = String(raw).toLowerCase()
  if (l.startsWith('en')) return 'en'
  if (l.startsWith('ja')) return 'ja'
  return 'zh-TW' // zh-Hant / zh-TW 預設對齊資料庫的 zh-TW
}

async function useMock() {
  if (process.env.FORCE_MOCK === 'true') return true
  try {
    await sequelize.authenticate()
    return false
  } catch {
    return true
  }
}

/**
 * 把 range 參數換算成 [from, to] 以及「對比前期」的 [prevFrom, prevTo]。
 */
function resolveRange(rangeRaw) {
  const range = RANGE_DAYS[rangeRaw] ? rangeRaw : '30d'
  const to = new Date()
  to.setUTCDate(to.getUTCDate() - 1) // 到昨天，避免今天資料還沒跑完不完整

  let from = new Date(to)
  if (range === 'ytd') {
    from = new Date(Date.UTC(to.getUTCFullYear(), 0, 1))
  } else {
    from.setUTCDate(from.getUTCDate() - (RANGE_DAYS[range] - 1))
  }

  const spanMs = to - from
  const prevTo = new Date(from)
  prevTo.setUTCDate(prevTo.getUTCDate() - 1)
  const prevFrom = new Date(prevTo - spanMs)

  const fmt = (d) => d.toISOString().slice(0, 10)
  return {
    range,
    from: fmt(from),
    to: fmt(to),
    prevFrom: fmt(prevFrom),
    prevTo: fmt(prevTo),
    days: Math.round(spanMs / 86400000) + 1,
  }
}

/**
 * GET /api/analytics/overview?range=30d&sellerId=15&lang=zh-TW
 */
router.get('/overview', async (req, res) => {
  const SellerID = Number(req.query.sellerId) || 15
  const period = resolveRange(req.query.range)
  // 動態讀取前端帶過來的語系參數或 header
  const lang = resolveLang(req.query.lang || req.headers['accept-language'])
  const Mock = await useMock()

  if (Mock) {
    try {
      const demo = readMock('analytics.json')
      return res.json({ success: true, range: period.range, period: null, ...demo })
    } catch (mockErr) {
      console.error('讀取 analytics.json 假資料失敗:', mockErr)
      return res.status(500).json({ success: false, message: 'Mock 資料讀取失敗' })
    }
  }

  try {
    const db = require('../models')
    const { Order, Orderdetail, Product, PageContent, PageVisit } = db

    const [cur, prev] = await Promise.all([
      buildProductRollup({ Order, Orderdetail, Product, PageContent, PageVisit }, SellerID, period.from, period.to, lang),
      buildProductRollup({ Order, Orderdetail, Product, PageContent, PageVisit }, SellerID, period.prevFrom, period.prevTo, lang),
    ])

    const payload = buildOverview(period, cur.rows, prev.rows, cur.totals, prev.totals, lang)
    return res.json({ success: true, ...payload })
  } catch (err) {
    console.error('[analytics/overview] 查詢失敗:', err)
    return res.status(500).json({ success: false, message: '伺服器內部發生錯誤', details: err.message })
  }
})

// ── 撈某段期間、某賣家的商品彙總（加入 lang 參數查詢多語系品名）──
async function buildProductRollup({ Order, Orderdetail, Product, PageContent, PageVisit }, SellerID, from, to, lang) {
  const dateRange = {
    [Op.gte]: literal(`'${from} 00:00:00'`),
    [Op.lte]: literal(`'${to} 23:59:59'`)
  }

  // 1) 有效訂單
  const orders = await Order.findAll({
    where: {
      SellerID,
      PaymentStatus: PAID_PAYMENT_STATUS,
      OrderStatus: { [Op.ne]: CANCELLED_ORDER_STATUS },
      CreatedAt: dateRange,
    },
    attributes: ['OrderID', 'TotalAmount'],
    raw: true,
  })
  const orderIds = orders.map((o) => o.OrderID)
  const totals = {
    orders_count: orders.length,
    revenue: orders.reduce((s, o) => s + (Number(o.TotalAmount) || 0), 0),
  }

  // 2) 訂單明細
  const details = orderIds.length
    ? await Orderdetail.findAll({ where: { OrderID: { [Op.in]: orderIds } }, raw: true })
    : []
  const salesByProduct = new Map()
  for (const d of details) {
    const cur = salesByProduct.get(d.ProductID) || { qty_sold: 0, revenue: 0, orderIds: new Set() }
    cur.qty_sold += Number(d.Quantity) || 0
    cur.revenue += (Number(d.Quantity) || 0) * (Number(d.UnitPrice) || 0)
    cur.orderIds.add(d.OrderID)
    salesByProduct.set(d.ProductID, cur)
  }

  // 3) 商品瀏覽事件
  const visits = await PageVisit.findAll({
    where: { SellerID, CreatedAt: dateRange },
    attributes: ['ProductID', 'SessionID'],
    raw: true,
  })
  const visitsByProduct = new Map()
  for (const v of visits) {
    const cur = visitsByProduct.get(v.ProductID) || { views: 0, sessions: new Set() }
    cur.views += 1
    if (v.SessionID) cur.sessions.add(v.SessionID)
    visitsByProduct.set(v.ProductID, cur)
  }

  // 4) 商品顯示名稱：先找指定 lang，沒有再 fallback 找中文預設語系 ('zh-TW')
const defaultLang = typeof DEFAULT_LANGUAGE !== 'undefined' ? DEFAULT_LANGUAGE : 'zh-TW';
const targetLang = lang || defaultLang;

const contents = await PageContent.findAll({
    where: { LanguageCode: targetLang },
    attributes: ['ProductID', 'ProductName', 'UpdatedAt'],
    order: [['UpdatedAt', 'DESC']],
    raw: true,
});

const nameByProduct = new Map();
for (const c of contents) {
    if (!nameByProduct.has(c.ProductID) && c.ProductName) {
        nameByProduct.set(c.ProductID, c.ProductName);
    }
}

// 🛡️ 雙保險：如果切換到英文/日文但有些商品沒翻譯，用預設語系 ('zh-TW') 補齊空缺 ID
if (targetLang !== defaultLang) {
    const fallbackContents = await PageContent.findAll({
        where: { LanguageCode: defaultLang },
        attributes: ['ProductID', 'ProductName', 'UpdatedAt'],
        order: [['UpdatedAt', 'DESC']],
        raw: true,
    });
    for (const c of fallbackContents) {
        if (!nameByProduct.has(c.ProductID) && c.ProductName) {
            nameByProduct.set(c.ProductID, c.ProductName);
        }
    }
}

  // 5) 商品主檔
  const products = await Product.findAll({ where: { SellerID }, raw: true })

  const rows = products.map((p) => {
    const sale = salesByProduct.get(p.ProductID) || { qty_sold: 0, revenue: 0, orderIds: new Set() }
    const visit = visitsByProduct.get(p.ProductID) || { views: 0, sessions: new Set() }
    return {
      product_id: p.ProductID,
      name: nameByProduct.get(p.ProductID) || p.ProductName || String(p.ProductID),
      stock: Number(p.Stock) || 0,
      is_active: !!p.IsActive,
      qty_sold: sale.qty_sold,
      revenue: sale.revenue,
      orders_count: sale.orderIds.size,
      views: visit.views,
      visit_sessions: visit.sessions.size,
    }
  })

  return { rows, totals }
}

function num(v) { return Number(v) || 0 }
function round4(n) { return Math.round((Number(n) || 0) * 10000) / 10000 }

function growthRate(cur, prev) {
  if (!prev) return null
  return (cur - prev) / prev
}

function activeRate(rows) {
  const listed = rows.filter((r) => r.is_active)
  const active = listed.filter((r) => num(r.qty_sold) > 0)
  return {
    active: active.length,
    total: listed.length,
    rate: listed.length ? active.length / listed.length : 0,
  }
}

function buildOverview(period, curRows, prevRows, curTotals, prevTotals, lang) {
  const revenue = num(curTotals.revenue)
  const orders = num(curTotals.orders_count)
  const prevRevenue = num(prevTotals.revenue)
  const prevOrders = num(prevTotals.orders_count)

  const aov = orders ? revenue / orders : 0
  const prevAov = prevOrders ? prevRevenue / prevOrders : 0

  const ar = activeRate(curRows)
  const prevAr = activeRate(prevRows)

  const kpi = {
    revenue: { value: Math.round(revenue), delta: growthRate(revenue, prevRevenue) },
    orders: { value: orders, delta: growthRate(orders, prevOrders) },
    activeRate: {
      value: round4(ar.rate),
      activeCount: ar.active,
      totalCount: ar.total,
      deltaPoint: round4(ar.rate - prevAr.rate),
    },
    avgOrderValue: { value: Math.round(aov), delta: growthRate(aov, prevAov) },
  }

  const topProducts = [...curRows]
    .sort((a, b) => num(b.qty_sold) - num(a.qty_sold))
    .slice(0, 5)
    .map((r) => ({
      productId: r.product_id,
      name: r.name,
      qtySold: num(r.qty_sold),
      revenue: Math.round(num(r.revenue)),
    }))

  const scored = curRows.map((r) => {
    const qty = num(r.qty_sold)
    const views = num(r.views)
    const dailyRate = qty / period.days
    const turnoverDays = dailyRate > 0 ? Math.round(num(r.stock) / dailyRate) : null
    const cvr = views ? qty / views : 0
    return {
      productId: r.product_id,
      name: r.name,
      views,
      qtySold: qty,
      conversionRate: round4(cvr),
      turnoverDays,
      tag: tagFor({ views, cvr, turnoverDays }),
    }
  })

  const lowPerformers = scored
    .filter((r) => r.tag)
    .sort((a, b) => rankTag(b.tag) - rankTag(a.tag) || a.qtySold - b.qtySold)
    .slice(0, 8)

  const productShare = buildProductShare(curRows, lang)

  const quadrant = curRows
    .map((r) => ({
      productId: r.product_id,
      name: r.name,
      traffic: num(r.visit_sessions),
      conversionRate: round4(num(r.views) ? num(r.qty_sold) / num(r.views) : 0),
      revenue: Math.round(num(r.revenue)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12)

  return {
    range: period.range,
    period: { from: period.from, to: period.to, prevFrom: period.prevFrom, prevTo: period.prevTo },
    kpi,
    topProducts,
    lowPerformers,
    productShare,
    quadrant,
    actions: buildActions({ topProducts, lowPerformers, productShare }, lang),
  }
}

const PRODUCT_SHARE_TOP_N = 6
function buildProductShare(rows, lang) {
  const otherName = lang === 'en' ? 'Other Products' : (lang === 'ja' ? 'その他の商品' : '其他商品')
  const total = rows.reduce((s, r) => s + num(r.revenue), 0) || 1
  const sold = [...rows].filter((r) => num(r.revenue) > 0).sort((a, b) => num(b.revenue) - num(a.revenue))
  const head = sold.slice(0, PRODUCT_SHARE_TOP_N).map((r) => ({
    productId: r.product_id,
    name: r.name,
    revenue: Math.round(num(r.revenue)),
    pct: round4(num(r.revenue) / total),
  }))
  const restRevenue = sold.slice(PRODUCT_SHARE_TOP_N).reduce((s, r) => s + num(r.revenue), 0)
  if (restRevenue > 0) {
    head.push({ productId: null, name: otherName, revenue: Math.round(restRevenue), pct: round4(restRevenue / total) })
  }
  return head
}

// 後端 sellerAnalytics.js
function tagFor({ views, cvr, turnoverDays }) {
  // 1. 高曝光低轉換
  if (views >= 500 && cvr < 0.01) return 'HIGH_TRAFFIC_LOW_CONV';

  // 2. 週轉天數過長（庫存呆滯）
  if (turnoverDays !== null && turnoverDays > 60) return 'STALE_LIQUIDATE';

  // 3. 週轉偏長但還在容忍範圍
  if (turnoverDays !== null && turnoverDays > 30) return 'OBSERVING';

  // 4. 無週轉天數（未曾售出）且長期無流量（可視需要加上上架時間判斷，避免誤殺新品）
  if (turnoverDays === null && views < 50) return 'STALE_NO_RESTOCK';

  return null;
}

function rankTag(tag) {
  return {
    STALE_LIQUIDATE: 3,
    STALE_NO_RESTOCK: 3,
    HIGH_TRAFFIC_LOW_CONV: 2,
    OBSERVING: 1
  }[tag] || 0;
}

/**
 * 🌟 核心修正：依語系組合建議行動句子
 */
function buildActions({ topProducts, lowPerformers, productShare }, lang = 'zh-TW') {
  const grow = []
  const optimize = []
  const cut = []

  // 1. 定義句子樣板與連接符號
  const templates = {
    'zh-TW': {
      sep: '、',
      actGrow: (names) => `追加庫存並投放廣告：${names}`,
      actOptTraffic: (name, cvr) => `${name}：有曝光但轉換 ${cvr}%，換主圖／訂價測試`,
      actCutStale: (name, days) => `${name}：週轉${days ? ` ${days} 天` : '過長'}，停止補貨、清庫存後下架`,
      actOptConcentration: (name, pct) => `「${name}」佔營收 ${pct}%，過度集中單一商品，建議培養第二主力分散風險`
    },
    'en': {
      sep: ', ',
      actGrow: (names) => `Restock & Run Ads: ${names}`,
      actOptTraffic: (name, cvr) => `${name}: Sufficient traffic but conversion rate is ${cvr}%; test hero images or pricing`,
      actCutStale: (name, days) => `${name}: Turnover ${days ? `is ${days} days` : 'is too long'}; halt restocking and liquidate`,
      actOptConcentration: (name, pct) => `"${name}" accounts for ${pct}% of revenue; high concentration, recommend developing a second driver`
    },
    'ja': {
      sep: '、',
      actGrow: (names) => `在庫追加・広告配信：${names}`,
      actOptTraffic: (name, cvr) => `${name}：露出はあるが転換率 ${cvr}%；メイン画像・価格の見直しを推奨`,
      actCutStale: (name, days) => `${name}：回転${days ? ` ${days} 日` : '日数が長期化'}；仕入れ停止・在庫処分後に掲載終了`,
      actOptConcentration: (name, pct) => `「${name}」が売上の ${pct}% を占めています。リスク分散のため第二の主力育成を推奨`
    }
  }

  const t = templates[lang] || templates['zh-TW']

  // 2. 加碼品項
  const hot = topProducts.slice(0, 2).map((p) => p.name).filter(Boolean)
  if (hot.length) {
    grow.push(t.actGrow(hot.join(t.sep)))
  }

  // 3. 優化與淘汰
  for (const r of lowPerformers) {
    if (r.tag === 'HIGH_TRAFFIC_LOW_CONV' || r.tag === '有流量沒轉換') {
      optimize.push(t.actOptTraffic(r.name, (r.conversionRate * 100).toFixed(1)))
    } else if (r.tag && (r.tag.startsWith('STALE_') || r.tag.startsWith('滯銷'))) {
      cut.push(t.actCutStale(r.name, r.turnoverDays))
    }
  }

  // 4. 集中度過高警告
  const top = productShare[0]
  if (top && top.productId && top.pct > 0.5) {
    optimize.push(t.actOptConcentration(top.name, (top.pct * 100).toFixed(0)))
  }

  return { grow, optimize, cut }
}

console.log("✅ sellerAnalytics.js 路由檔案已成功載入")

module.exports = router