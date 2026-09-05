// 模組對應資料表：Order, Orderdetail, Product, PageContent, PageVisit
// 對應頁面：goez-shop-sales-analytics.html（銷售成效追蹤）
//
// 寫法比照 store.js：Sequelize、useMock() 掉回假資料、欄位直接用資料庫的
// PascalCase（ProductID / SellerID ...），不轉成小寫底線。
//
// 目前沒有真的登入 session，SellerID 一律吃 query 參數 + 預設值 15，
// 跟 store.js 的 /my-stores 用同一套（等真的登入系統做好，把這行換成
// session 讀值即可，其他都不用動）。
//
// 【欄位真實值，來自 SCHEMA.md】
//   Order.PaymentStatus（int）：0=未付款 1=已付款 2=退款中 3=已退款 4=付款失敗
//   Order.OrderStatus（代碼）：0=處理中 1=待出貨 2=已出貨 3=已送達 4=完成取貨 5=已取消
//   營收/訂單數一律用 PaymentStatus=1 且 OrderStatus<>5 判定為有效訂單。
//
// 【還要確認的假設】
//   - PageContent.LanguageCode 預設代碼是不是 'zh-TW'（跟 store.js 用一樣的值）
//   - Product 是否真的有 Category 欄位（store.js 裡看到 prodMain?.Category，
//     如果有，「商品銷售佔比」可以改回真的分類佔比，見 buildProductShare 註解）

const express = require('express')
const { Op } = require('sequelize')
const sequelize = require('../config/database')
const { readMock } = require('../src/mocks/utils')

const router = express.Router()

const PAID_PAYMENT_STATUS = 1
const CANCELLED_ORDER_STATUS = '5'
const DEFAULT_LANGUAGE = 'zh-TW'
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 }

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
 * GET /api/analytics/overview?range=30d&sellerId=15
 *
 * Response（前端 goez-shop-sales-analytics.html 直接吃這個形狀）：
 * {
 *   "success": true,
 *   "range": "30d",
 *   "period": { "from","to","prevFrom","prevTo" },
 *   "kpi": {
 *     "revenue":       { "value": 539300, "delta": 0.124 },
 *     "orders":        { "value": 486,    "delta": 0.081 },
 *     "activeRate":    { "value": 0.75, "activeCount": 18, "totalCount": 24, "deltaPoint": 0.04 },
 *     "avgOrderValue": { "value": 1110,   "delta": -0.023 }
 *   },
 *   "topProducts":   [ { "productId","name","qtySold","revenue" } ],
 *   "lowPerformers": [ { "productId","name","views","qtySold","conversionRate","turnoverDays","tag" } ],
 *   "productShare":  [ { "productId","name","revenue","pct" } ],
 *   "quadrant":      [ { "productId","name","traffic","conversionRate","revenue" } ],
 *   "actions":       { "grow":[string], "optimize":[string], "cut":[string] }
 * }
 */
router.get('/overview', async (req, res) => {
  const SellerID = Number(req.query.sellerId) || 15
  const period = resolveRange(req.query.range)
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
      buildProductRollup({ Order, Orderdetail, Product, PageContent, PageVisit }, SellerID, period.from, period.to),
      buildProductRollup({ Order, Orderdetail, Product, PageContent, PageVisit }, SellerID, period.prevFrom, period.prevTo),
    ])

    const payload = buildOverview(period, cur.rows, prev.rows, cur.totals, prev.totals)
    return res.json({ success: true, ...payload })
  } catch (err) {
    console.error('[analytics/overview] 查詢失敗:', err)
    return res.status(500).json({ success: false, message: '伺服器內部發生錯誤', details: err.message })
  }
})

// ── 撈某段期間、某賣家的商品彙總（手動查 + 手動彙總，比照 store.js 風格）──
async function buildProductRollup({ Order, Orderdetail, Product, PageContent, PageVisit }, SellerID, from, to) {
  const dateRange = { [Op.gte]: new Date(`${from}T00:00:00`), [Op.lte]: new Date(`${to}T23:59:59`) }

  // 1) 有效訂單（已付款、未取消）→ 賣場層級的營收/訂單數
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

  // 2) 訂單明細 → 依商品彙總銷量/營收（只查上面那批有效訂單的明細）
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

  // 3) 商品瀏覽事件 → 依商品彙總曝光數（views）與去重工作階段數（visit_sessions）
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

  // 4) 商品顯示名稱：PageContent 依商品取「最近更新」一筆（同商品可能多頁/多語系都有內容）
  const contents = await PageContent.findAll({
    where: { LanguageCode: DEFAULT_LANGUAGE },
    attributes: ['ProductID', 'ProductName', 'UpdatedAt'],
    order: [['UpdatedAt', 'DESC']],
    raw: true,
  })
  const nameByProduct = new Map()
  for (const c of contents) {
    if (!nameByProduct.has(c.ProductID)) nameByProduct.set(c.ProductID, c.ProductName) // 已按 UpdatedAt DESC 排序，第一筆就是最新
  }

  // 5) 商品主檔：決定「上架商品」清單（動銷率分母）
  const products = await Product.findAll({ where: { SellerID }, raw: true })

  const rows = products.map((p) => {
    const sale = salesByProduct.get(p.ProductID) || { qty_sold: 0, revenue: 0, orderIds: new Set() }
    const visit = visitsByProduct.get(p.ProductID) || { views: 0, sessions: new Set() }
    return {
      product_id: p.ProductID,
      name: nameByProduct.get(p.ProductID) || String(p.ProductID),
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

// ══════════════════════════════════════════════════════════════════
// 以下是把彙總列組成前端要的形狀——跟資料庫怎麼查完全無關，之後不管
// 資料庫怎麼換，這段都不用動。
// ══════════════════════════════════════════════════════════════════

function num(v) { return Number(v) || 0 }
function round4(n) { return Math.round((Number(n) || 0) * 10000) / 10000 }

function growthRate(cur, prev) {
  if (!prev) return null
  return (cur - prev) / prev
}

// 動銷率：上架品項（IsActive）中，期間內 qty_sold > 0 的比例
function activeRate(rows) {
  const listed = rows.filter((r) => r.is_active)
  const active = listed.filter((r) => num(r.qty_sold) > 0)
  return {
    active: active.length,
    total: listed.length,
    rate: listed.length ? active.length / listed.length : 0,
  }
}

function buildOverview(period, curRows, prevRows, curTotals, prevTotals) {
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

  const productShare = buildProductShare(curRows)

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
    actions: buildActions({ topProducts, lowPerformers, productShare }),
  }
}

// 商品銷售佔比：依營收排序取前 TOP_N 名，其餘併成一筆「其他商品」
// TODO：如果 Product 真的有 Category 欄位（store.js 裡看到 prodMain?.Category），
// 可以改成依分類 group by，會比現在這個更貼近原本「分類銷售佔比」的設計。
const PRODUCT_SHARE_TOP_N = 6
function buildProductShare(rows) {
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
    head.push({ productId: null, name: '其他商品', revenue: Math.round(restRevenue), pct: round4(restRevenue / total) })
  }
  return head
}

function tagFor({ views, cvr, turnoverDays }) {
  if (views >= 500 && cvr < 0.01) return '有流量沒轉換'
  if (turnoverDays === null && views < 50) return '滯銷不需補貨'
  if (turnoverDays !== null && turnoverDays > 60) return '滯銷可下架'
  if (turnoverDays !== null && turnoverDays > 30) return '觀察中'
  return null
}
function rankTag(tag) {
  return { 滯銷可下架: 3, 滯銷不需補貨: 3, 有流量沒轉換: 2, 觀察中: 1 }[tag] || 0
}

function buildActions({ topProducts, lowPerformers, productShare }) {
  const grow = []
  const optimize = []
  const cut = []

  const hot = topProducts.slice(0, 2).map((p) => p.name).filter(Boolean)
  if (hot.length) grow.push(`追加庫存並投放廣告：${hot.join('、')}`)

  for (const r of lowPerformers) {
    if (r.tag === '有流量沒轉換') optimize.push(`${r.name}：有曝光但轉換 ${(r.conversionRate * 100).toFixed(1)}%，換主圖／訂價測試`)
    else if (r.tag.startsWith('滯銷')) cut.push(`${r.name}：週轉${r.turnoverDays ? ` ${r.turnoverDays} 天` : '過長'}，停止補貨、清庫存後下架`)
  }

  const top = productShare[0]
  if (top && top.productId && top.pct > 0.5) {
    optimize.push(`「${top.name}」佔營收 ${(top.pct * 100).toFixed(0)}%，過度集中單一商品，建議培養第二主力分散風險`)
  }

  return { grow, optimize, cut }
}

console.log("✅ sellerAnalytics.js 路由檔案已成功載入")

module.exports = router
