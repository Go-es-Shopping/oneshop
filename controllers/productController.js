const sequelize = require('../config/database')
const { Product, PageContent } = require('../models')
const { readMock } = require('../src/mocks/utils')

async function useMock() {
  // 優先判定 Mock，不執行資料庫檢查以解決連線超時問題
  if (process.env.FORCE_MOCK === 'true') return true
  try {
    await sequelize.authenticate()
    return false
  } catch {
    return true
  }
}

function dec2(v) {
  if (v === undefined || v === null || v === '') return v
  return Number(v).toFixed(2)
}

function toBoolBit(v) {
  if (v === undefined || v === null || v === '') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'number') return v ? 1 : 0
  return v === '1' || v === 'true' ? 1 : 0
}

function flattenProduct(p, Lang) {
  const base = {
    ProductID: p.ProductID,
    SellerID: p.SellerID,
    ProductImg: p.ProductImg,
    Price: typeof p.Price === 'string' ? p.Price : dec2(p.Price),
    Stock: p.Stock,
    IsActive: p.IsActive
  }
  const c = Array.isArray(p.PageContents) && p.PageContents.length ? p.PageContents[0] : null
  return {
    ...base,
    LanguageCode: c ? c.LanguageCode : Lang,
    ProductName: c ? c.ProductName : undefined,
    ProductDescription: c ? c.ProductDescription : undefined
  }
}

async function listProducts(req, res) {
  try {
    const Mock = await useMock()
    const Lang = req.query.lang || 'zh-TW'
    const SellerID = req.query.SellerID ? Number(req.query.SellerID) : undefined
    const IsActive = req.query.IsActive !== undefined ? toBoolBit(req.query.IsActive) : undefined

    if (Mock) {
      let List = readMock('product.json').list.map(p => ({ ...p, LanguageCode: Lang }))
      if (SellerID !== undefined) List = List.filter(p => p.SellerID === SellerID)
      if (IsActive !== undefined) List = List.filter(p => Number(p.IsActive) === Number(IsActive))
      return res.json(List)
    }

    const where = {}
    if (SellerID !== undefined) where.SellerID = SellerID
    if (IsActive !== undefined) where.IsActive = IsActive
    const rows = await Product.findAll({
      where,
      include: [
        {
          model: PageContent,
          where: { LanguageCode: Lang },
          required: false,
          attributes: ['LanguageCode', 'ProductName', 'ProductDescription']
        }
      ]
    })
    const data = rows.map(r => flattenProduct(r.toJSON(), Lang))
    return res.json(data)
  } catch (err) {
    console.error('listProducts error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

async function getProduct(req, res) {
  try {
    const Mock = await useMock()
    const Lang = req.query.lang || 'zh-TW'
    const ProductID = Number(req.params.ProductID)
    if (Mock) {
      const base = readMock('product.json').detail
      const data = {
        ...base,
        ProductID: ProductID,
        ProductImg: `https://cdn.example.com/p/${ProductID}.png`,
        LanguageCode: Lang
      }
      return res.json(data)
    }
    const row = await Product.findByPk(ProductID, {
      include: [
        {
          model: PageContent,
          where: { LanguageCode: Lang },
          required: false,
          attributes: ['LanguageCode', 'ProductName', 'ProductDescription']
        }
      ]
    })
    if (!row) return res.status(404).json({ error: 'Not Found' })
    const data = flattenProduct(row.toJSON(), Lang)
    return res.json(data)
  } catch (err) {
    console.error('getProduct error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

async function createProduct(req, res) {
  try {
    const Mock = await useMock()
    const body = req.body || {}
    if (Mock) {
      const base = readMock('product.json').detail
      const newId = 2002
      const data = {
        ProductID: newId,
        SellerID: body.SellerID ?? base.SellerID,
        ProductImg: body.ProductImg ?? base.ProductImg,
        Price: dec2(body.Price ?? base.Price),
        Stock: body.Stock ?? base.Stock,
        IsActive: toBoolBit(body.IsActive ?? base.IsActive),
        LanguageCode: body.lang || base.LanguageCode,
        ProductName: base.ProductName,
        ProductDescription: base.ProductDescription
      }
      return res.status(201).json(data)
    }
    const createData = {
      SellerID: Number(body.SellerID),
      ProductImg: body.ProductImg,
      Price: dec2(body.Price),
      Stock: Number(body.Stock),
      IsActive: toBoolBit(body.IsActive ?? 1),
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    }
    const created = await Product.create(createData)
    const result = {
      ProductID: created.ProductID,
      SellerID: created.SellerID,
      ProductImg: created.ProductImg,
      Price: typeof created.Price === 'string' ? created.Price : dec2(created.Price),
      Stock: created.Stock,
      IsActive: created.IsActive
    }
    return res.status(201).json(result)
  } catch (err) {
    console.error('createProduct error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

async function updateProduct(req, res) {
  try {
    const Mock = await useMock()
    const ProductID = Number(req.params.ProductID)
    const body = req.body || {}
    if (Mock) {
      const base = readMock('product.json').detail
      const data = {
        ProductID: ProductID,
        SellerID: body.SellerID ?? base.SellerID,
        ProductImg: body.ProductImg ?? base.ProductImg,
        Price: body.Price !== undefined ? dec2(body.Price) : base.Price,
        Stock: body.Stock !== undefined ? Number(body.Stock) : base.Stock,
        IsActive: body.IsActive !== undefined ? toBoolBit(body.IsActive) : base.IsActive,
        LanguageCode: body.lang || base.LanguageCode,
        ProductName: base.ProductName,
        ProductDescription: base.ProductDescription
      }
      return res.json(data)
    }
    const row = await Product.findByPk(ProductID)
    if (!row) return res.status(404).json({ error: 'Not Found' })
    if (body.ProductImg !== undefined) row.ProductImg = body.ProductImg
    if (body.Price !== undefined) row.Price = dec2(body.Price)
    if (body.Stock !== undefined) row.Stock = Number(body.Stock)
    if (body.IsActive !== undefined) row.IsActive = toBoolBit(body.IsActive)
    row.UpdatedAt = new Date()
    await row.save()
    const result = {
      ProductID: row.ProductID,
      SellerID: row.SellerID,
      ProductImg: row.ProductImg,
      Price: typeof row.Price === 'string' ? row.Price : dec2(row.Price),
      Stock: row.Stock,
      IsActive: row.IsActive
    }
    return res.json(result)
  } catch (err) {
    console.error('updateProduct error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

async function deleteProduct(req, res) {
  try {
    const Mock = await useMock()
    const ProductID = Number(req.params.ProductID)
    if (Mock) {
      return res.status(204).send()
    }
    const row = await Product.findByPk(ProductID)
    if (!row) return res.status(404).json({ error: 'Not Found' })
    await row.destroy()
    return res.status(204).send()
  } catch (err) {
    console.error('deleteProduct error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
}
