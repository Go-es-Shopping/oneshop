/**
 * ====================================================================
 * Goez Shop — 銷售成效追蹤 後端路由
 * ====================================================================
 * 對應頁面：goez-shop-sales-analytics.html
 *
 * 【定位】
 * 系統「主動」從資料庫彙總每個賣家自己賣場的銷售狀況，直接吐 JSON 給
 * 前端畫圖（純 HTML/CSS/SVG，不用 Power BI）。賣家登入後不需要匯入
 * 任何報表，打開這頁就看到自己的最新數據。
 *
 * 【資料來源 —— 對應賣家提供的 ER 圖，不是舊版 db/schema.sql】
 *   Seller       ─┬─ Product(SellerID)
 *                 ├─ StorePage(SellerID) ─ PageProduct(PageID) ─ Product(ProductID)
 *                 ├─ Order(SellerID) ─ Orderdetail(OrderID, ProductID)
 *                 └─ PageVisit(SellerID, ProductID)   ← 流量／曝光事件
 *   PageContent(PageID, ProductID, LanguageCode) 存商品在各頁的顯示名稱
 *     （Product 本身沒有 Name 欄位）
 *   Order 有 SessionID，PageVisit 也有 SessionID —— 如果之後想做真的
 *   session-based 賣場轉換率，兩邊用 SessionID 對得起來；但這頁的 KPI
 *   目前用「商品動銷率」而不是轉換率（賣家覺得轉換率對決策沒幫助）。
 *
 * 【隔離】
 * 一律用 session 內的 sellerId 當 WHERE 條件，賣家只會查到自己的資料。
 * 前端傳來的任何 ID 都忽略，避免越權查別人賣場。
 *
 * 【資料庫引擎：SQL Server（已跟夥伴確認，2026-09）】
 * 這支檔案用 `mssql` 套件（tedious 驅動）：具名參數 `@xxx`（不是 Postgres 的
 * `$1`）、欄位用 `[中括號]`（不是雙引號）、日期用 `CAST(col AS DATE)`
 * （不是 `col::date`）。Postgres 沒有 `SELECT DISTINCT ON`，商品名稱那段
 * 改用 `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)` 取每個商品最新
 * 一筆，效果一樣。
 * 記得先裝套件：`npm install mssql`
 *
 * 【⚠️ 需要你確認/替換的假設，都標了 TODO】
 *   1. PageContent.LanguageCode 的預設語系代碼（現在猜 'zh-TW'）
 *   2. 沒有 Category 表，「商品銷售佔比」改成直接依商品營收排名（見 buildProductShare）
 *   3. 連線設定支援 `DATABASE_URL`（mssql:// 連線字串）或 DB_SERVER/
 *      DB_DATABASE/DB_USER/DB_PASSWORD 離散變數，見 buildDbConfig()。
 *      本機測試可以直接用 server/app.js + .env.example。
 *
 * 【Order 狀態欄位真實值 —— 來自夥伴 SCHEMA.md（Buyer Orders 文件），2026-09】
 *   Order.PaymentStatus（int）：0=未付款 1=已付款 2=退款中 3=已退款 4=付款失敗
 *   Order.OrderStatus（文件寫 nvarchar(30)，但存的是代碼）：
 *     0=處理中 1=待出貨 2=已出貨 3=已送達 4=完成取貨 5=已取消
 *   本檔案「營收/訂單數」一律用 PaymentStatus=1（已付款）且排除 OrderStatus=5
 *   （已取消）判定為有效訂單——物流走到哪個階段（處理中～完成取貨）都算數，
 *   只有「沒付錢」或「取消了」才不算。跟 Payment 表自己的 PaymentStatus（文字、
 *   付款方式明細用）是不同欄位，這裡故意用 Order 上那個做整體篩選。
 *
 * 【前端一律只看 JSON 的 success 欄位判斷成功/失敗】
 * 成功回 200 + { success:true, ... }；失敗回 4xx/5xx + { success:false, message }。
 *
 * 掛載方式（在你的 app.js / server.js）：
 *   const analyticsRouter = require('./server/routes/analytics');
 *   app.use('/api/analytics', analyticsRouter);
 * ====================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const sql = require('mssql');

// TODO: 換成你們專案既有的連線設定（別重複建連線池）
// mssql 套件的 ConnectionPool 建構子吃「連線字串（字串）」或「設定物件」，
// 不吃 { connectionString: 'xxx' } 這種包法（那是 pg 套件的寫法，兩者不一樣）。
function buildDbConfig() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL; // 例如 mssql://user:pass@host:1433/dbname
  }
  return {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    options: {
      encrypt: process.env.DB_ENCRYPT !== 'false',              // Azure SQL 預設要 true
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // 本機測試常需要 true
    },
  };
}

let poolPromise = null;
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(buildDbConfig()).connect().catch((err) => {
      poolPromise = null; // 連線失敗就清掉快取，下一次請求會重新嘗試，而不是卡住同一個壞掉的 promise
      throw err;
    });
  }
  return poolPromise;
}

// 建立一個帶好參數的 request，避免每支查詢都重複寫六次 .input()
function makeRequest(pool, params) {
  const req = pool.request();
  if (params.sellerId !== undefined) req.input('sellerId', sql.Int, params.sellerId);
  if (params.dateFrom !== undefined) req.input('dateFrom', sql.Date, params.dateFrom);
  if (params.dateTo !== undefined) req.input('dateTo', sql.Date, params.dateTo);
  if (params.lang !== undefined) req.input('lang', sql.NVarChar(10), params.lang);
  if (params.paid !== undefined) req.input('paid', sql.Int, params.paid);
  if (params.cancelled !== undefined) req.input('cancelled', sql.NVarChar(10), params.cancelled);
  return req;
}

// Order.PaymentStatus（int）＝ 1 代表已付款（來源：SCHEMA.md，見檔頭說明）
const PAID_PAYMENT_STATUS = 1;
// Order.OrderStatus 代碼 5 ＝ 已取消，營收/訂單數要排除
const CANCELLED_ORDER_STATUS = '5';
// TODO: 確認 PageContent 的預設語系代碼
const DEFAULT_LANGUAGE = 'zh-TW';

// ── 期間對照 ─────────────────────────────────────────────────────────
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

/**
 * 把 range 參數換算成 [from, to] 以及「對比前期」的 [prevFrom, prevTo]。
 */
function resolveRange(rangeRaw) {
  const range = RANGE_DAYS[rangeRaw] ? rangeRaw : '30d';
  const to = new Date();
  to.setUTCDate(to.getUTCDate() - 1); // 到昨天，避免今天資料還沒跑完不完整

  let from = new Date(to);
  if (range === 'ytd') {
    from = new Date(Date.UTC(to.getUTCFullYear(), 0, 1));
  } else {
    from.setUTCDate(from.getUTCDate() - (RANGE_DAYS[range] - 1));
  }

  const spanMs = to - from;
  const prevTo = new Date(from);
  prevTo.setUTCDate(prevTo.getUTCDate() - 1);
  const prevFrom = new Date(prevTo - spanMs);

  const fmt = (d) => d.toISOString().slice(0, 10);
  return {
    range,
    from: fmt(from),
    to: fmt(to),
    prevFrom: fmt(prevFrom),
    prevTo: fmt(prevTo),
    days: Math.round(spanMs / 86400000) + 1,
  };
}

// ── 主查詢：某段期間內、某賣家每個商品的彙總 ─────────────────────────
// 具名參數：@sellerId @dateFrom @dateTo @lang @paid @cancelled
// - 名稱：PageContent 依商品取「最近更新」一筆（同商品可能在多頁/多語系都有內容）
//   T-SQL 沒有 Postgres 的 DISTINCT ON，改用 ROW_NUMBER() 取每組第一筆
// - 銷售：Orderdetail join Order，只算已付款且未取消、期間內
// - 流量：PageVisit 依商品聚合，views = 事件數，visitSessions = 去重後的工作階段數
const SQL_PRODUCT_ROLLUP = `
  WITH product_name AS (
    SELECT product_id, name FROM (
      SELECT
        pc.[ProductID]   AS product_id,
        pc.[ProductName] AS name,
        ROW_NUMBER() OVER (PARTITION BY pc.[ProductID] ORDER BY pc.[UpdatedAt] DESC) AS rn
      FROM [PageContent] pc
      WHERE pc.[LanguageCode] = @lang
    ) ranked
    WHERE rn = 1
  ),
  sales AS (
    SELECT
      od.[ProductID]                                   AS product_id,
      SUM(od.[Quantity])                                AS qty_sold,
      SUM(od.[Quantity] * od.[UnitPrice])                AS revenue,
      COUNT(DISTINCT od.[OrderID])                       AS orders_count
    FROM [Orderdetail] od
    JOIN [Order] o ON o.[OrderID] = od.[OrderID]
    WHERE o.[SellerID] = @sellerId
      AND o.[PaymentStatus] = @paid
      AND o.[OrderStatus] <> @cancelled
      AND CAST(o.[CreatedAt] AS DATE) BETWEEN @dateFrom AND @dateTo
    GROUP BY od.[ProductID]
  ),
  visits AS (
    SELECT
      pv.[ProductID]                     AS product_id,
      COUNT(*)                            AS views,
      COUNT(DISTINCT pv.[SessionID])      AS visit_sessions
    FROM [PageVisit] pv
    WHERE pv.[SellerID] = @sellerId
      AND CAST(pv.[CreatedAt] AS DATE) BETWEEN @dateFrom AND @dateTo
    GROUP BY pv.[ProductID]
  )
  SELECT
    p.[ProductID]                                          AS product_id,
    COALESCE(pn.name, CAST(p.[ProductID] AS NVARCHAR(50))) AS name,
    p.[Stock]                                              AS stock,
    p.[IsActive]                                            AS is_active,
    COALESCE(s.qty_sold, 0)                                AS qty_sold,
    COALESCE(s.revenue, 0)                                 AS revenue,
    COALESCE(s.orders_count, 0)                            AS orders_count,
    COALESCE(v.views, 0)                                   AS views,
    COALESCE(v.visit_sessions, 0)                          AS visit_sessions
  FROM [Product] p
  LEFT JOIN product_name pn ON pn.product_id = p.[ProductID]
  LEFT JOIN sales  s ON s.product_id = p.[ProductID]
  LEFT JOIN visits v ON v.product_id = p.[ProductID]
  WHERE p.[SellerID] = @sellerId
`;

// 賣場層級：訂單數 / 營收（直接用 Order.TotalAmount，不用重新 SUM Orderdetail）
const SQL_STORE_TOTALS = `
  SELECT
    COUNT(*)                          AS orders_count,
    COALESCE(SUM(o.[TotalAmount]), 0) AS revenue
  FROM [Order] o
  WHERE o.[SellerID] = @sellerId
    AND o.[PaymentStatus] = @paid
    AND o.[OrderStatus] <> @cancelled
    AND CAST(o.[CreatedAt] AS DATE) BETWEEN @dateFrom AND @dateTo
`;

/**
 * GET /api/analytics/overview?range=30d
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
 *   "productShare":  [ { "productId","name","revenue","pct" } ],   // 商品銷售佔比（沒有分類表，直接依商品營收排名，取前 6 名 + 「其他商品」）
 *   "quadrant":      [ { "productId","name","traffic","conversionRate","revenue" } ],
 *   "actions":       { "grow":[string], "optimize":[string], "cut":[string] }
 * }
 */
router.get('/overview', async (req, res) => {
  // TODO: 換成你們的 session 欄位。登入中介層應已把賣家的 SellerID 放進 session。
  const sellerId = req.session?.sellerId || req.session?.SellerID;
  if (!sellerId) {
    return res.status(401).json({ success: false, message: '未登入或 session 沒有 sellerId' });
  }

  const p = resolveRange(req.query.range);

  try {
    const pool = await getPool();
    const commonStatus = { paid: PAID_PAYMENT_STATUS, cancelled: CANCELLED_ORDER_STATUS };

    const [curRows, prevRows, curTotals, prevTotals] = await Promise.all([
      makeRequest(pool, { sellerId, dateFrom: p.from, dateTo: p.to, lang: DEFAULT_LANGUAGE, ...commonStatus }).query(SQL_PRODUCT_ROLLUP),
      makeRequest(pool, { sellerId, dateFrom: p.prevFrom, dateTo: p.prevTo, lang: DEFAULT_LANGUAGE, ...commonStatus }).query(SQL_PRODUCT_ROLLUP),
      makeRequest(pool, { sellerId, dateFrom: p.from, dateTo: p.to, ...commonStatus }).query(SQL_STORE_TOTALS),
      makeRequest(pool, { sellerId, dateFrom: p.prevFrom, dateTo: p.prevTo, ...commonStatus }).query(SQL_STORE_TOTALS),
    ]);

    const payload = buildOverview(
      p,
      curRows.recordset,
      prevRows.recordset,
      curTotals.recordset[0],
      prevTotals.recordset[0]
    );
    return res.json({ success: true, ...payload });
  } catch (err) {
    console.error('[analytics/overview] 查詢失敗:', err);
    return res.status(500).json({ success: false, message: '銷售數據查詢失敗' });
  }
});

// ── 把 DB 列組成前端要的形狀 ────────────────────────────────────────
function num(v) { return Number(v) || 0; }
function round4(n) { return Math.round((Number(n) || 0) * 10000) / 10000; }

function growthRate(cur, prev) {
  if (!prev) return null; // 前期沒資料 → 不顯示成長率
  return (cur - prev) / prev;
}

// 動銷率：上架品項（IsActive = true）中，期間內 qty_sold > 0 的比例
// mssql 把 bit 欄位映射成 JS boolean，但保留 1 當備援以防驅動版本行為不同
function activeRate(rows) {
  const listed = rows.filter((r) => r.is_active === true || r.is_active === 1);
  const active = listed.filter((r) => num(r.qty_sold) > 0);
  return {
    active: active.length,
    total: listed.length,
    rate: listed.length ? active.length / listed.length : 0,
  };
}

function buildOverview(period, curRows, prevRows, curTotals, prevTotals) {
  // 賣場層級 KPI（訂單/營收走 Order 表）
  const revenue = num(curTotals.revenue);
  const orders = num(curTotals.orders_count);
  const prevRevenue = num(prevTotals.revenue);
  const prevOrders = num(prevTotals.orders_count);

  const aov = orders ? revenue / orders : 0;
  const prevAov = prevOrders ? prevRevenue / prevOrders : 0;

  const ar = activeRate(curRows);
  const prevAr = activeRate(prevRows);

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
  };

  // 暢銷 Top 5（依售出件數）
  const topProducts = [...curRows]
    .sort((a, b) => num(b.qty_sold) - num(a.qty_sold))
    .slice(0, 5)
    .map((r) => ({
      productId: r.product_id,
      name: r.name,
      qtySold: num(r.qty_sold),
      revenue: Math.round(num(r.revenue)),
    }));

  // 受眾少 / 滯銷：views 來自 PageVisit，turnoverDays 用 Stock + 期間銷量估算
  const scored = curRows.map((r) => {
    const qty = num(r.qty_sold);
    const views = num(r.views);
    const dailyRate = qty / period.days;
    const turnoverDays = dailyRate > 0 ? Math.round(num(r.stock) / dailyRate) : null; // null = 期間內完全沒賣
    const cvr = views ? qty / views : 0;
    return {
      productId: r.product_id,
      name: r.name,
      views,
      qtySold: qty,
      conversionRate: round4(cvr),
      turnoverDays,
      tag: tagFor({ views, cvr, turnoverDays }),
    };
  });

  const lowPerformers = scored
    .filter((r) => r.tag)
    .sort((a, b) => rankTag(b.tag) - rankTag(a.tag) || a.qtySold - b.qtySold)
    .slice(0, 8);

  // 商品銷售佔比（沒有分類表，直接用這批 curRows 依商品營收排名，取前 6 名 + 其他商品）
  const productShare = buildProductShare(curRows);

  // 象限圖點：x=流量（去重 session）, y=轉換率, 泡泡大小=營收
  const quadrant = curRows
    .map((r) => ({
      productId: r.product_id,
      name: r.name,
      traffic: num(r.visit_sessions),
      conversionRate: round4(num(r.views) ? num(r.qty_sold) / num(r.views) : 0),
      revenue: Math.round(num(r.revenue)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12);

  return {
    range: period.range,
    period: { from: period.from, to: period.to, prevFrom: period.prevFrom, prevTo: period.prevTo },
    kpi,
    topProducts,
    lowPerformers,
    productShare,
    quadrant,
    actions: buildActions({ topProducts, lowPerformers, productShare }),
  };
}

// 商品銷售佔比：依營收排序取前 TOP_N 名，其餘併成一筆「其他商品」，pct 保證加總為 1
const PRODUCT_SHARE_TOP_N = 6;
function buildProductShare(rows) {
  const total = rows.reduce((s, r) => s + num(r.revenue), 0) || 1;
  const sold = [...rows].filter((r) => num(r.revenue) > 0).sort((a, b) => num(b.revenue) - num(a.revenue));
  const head = sold.slice(0, PRODUCT_SHARE_TOP_N).map((r) => ({
    productId: r.product_id,
    name: r.name,
    revenue: Math.round(num(r.revenue)),
    pct: round4(num(r.revenue) / total),
  }));
  const restRevenue = sold.slice(PRODUCT_SHARE_TOP_N).reduce((s, r) => s + num(r.revenue), 0);
  if (restRevenue > 0) {
    head.push({ productId: null, name: '其他商品', revenue: Math.round(restRevenue), pct: round4(restRevenue / total) });
  }
  return head;
}

function tagFor({ views, cvr, turnoverDays }) {
  if (views >= 500 && cvr < 0.01) return '有流量沒轉換';
  if (turnoverDays === null && views < 50) return '滯銷不需補貨';
  if (turnoverDays !== null && turnoverDays > 60) return '滯銷可下架';
  if (turnoverDays !== null && turnoverDays > 30) return '觀察中';
  return null;
}
function rankTag(tag) {
  return { 滯銷可下架: 3, 滯銷不需補貨: 3, 有流量沒轉換: 2, 觀察中: 1 }[tag] || 0;
}

/**
 * 依上面幾張表歸納「建議行動」三欄。規則式版本，之後要接 AI 再替換。
 */
function buildActions({ topProducts, lowPerformers, productShare }) {
  const grow = [];
  const optimize = [];
  const cut = [];

  const hot = topProducts.slice(0, 2).map((p) => p.name).filter(Boolean);
  if (hot.length) grow.push(`追加庫存並投放廣告：${hot.join('、')}`);

  for (const r of lowPerformers) {
    if (r.tag === '有流量沒轉換') optimize.push(`${r.name}：有曝光但轉換 ${(r.conversionRate * 100).toFixed(1)}%，換主圖／訂價測試`);
    else if (r.tag.startsWith('滯銷')) cut.push(`${r.name}：週轉${r.turnoverDays ? ` ${r.turnoverDays} 天` : '過長'}，停止補貨、清庫存後下架`);
  }

  // 單一商品營收佔比過半 → 提醒集中度風險
  const top = productShare[0];
  if (top && top.productId && top.pct > 0.5) {
    optimize.push(`「${top.name}」佔營收 ${(top.pct * 100).toFixed(0)}%，過度集中單一商品，建議培養第二主力分散風險`);
  }

  return { grow, optimize, cut };
}

module.exports = router;
