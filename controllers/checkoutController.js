const db = require('../models');
const { readMock } = require('../src/mocks/utils');

/**
 * 模擬判定邏輯 (與 seller/admin controller 保持一致)
 */
async function useMock() {
  if (process.env.FORCE_MOCK === 'true') return true;
  try {
    if (db.sequelize) {
      await db.sequelize.authenticate();
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

exports.calculate = async (req, res) => {
  const body = req.body || {};
  // 同步支援 PascalCase 與 camelCase
  const rawCartItems = body.CartItems || body.cartItems;

  if (!rawCartItems || !Array.isArray(rawCartItems) || rawCartItems.length === 0) {
    return res.status(400).json({ message: '購物車內容不可為空' });
  }

  // 標準化為 PascalCase 內部邏輯使用
  const CartItems = rawCartItems.map(item => ({
    ProductID: item.ProductID !== undefined ? item.ProductID : item.productId,
    Quantity: item.Quantity !== undefined ? item.Quantity : item.quantity
  }));

  // 新增檢查：商品數量必須大於 0
  for (const item of CartItems) {
    if (item.Quantity === undefined || item.Quantity <= 0) {
      return res.status(400).json({ message: '商品數量必須大於 0' });
    }
  }

  const isMock = await useMock();

  if (isMock) {
    // Mock 模式：從 mock 檔案讀取
    const mockProducts = readMock('product.json').list;
    let Subtotal = 0;
    const Items = [];

    for (const item of CartItems) {
      const mockProduct = mockProducts.find(p => p.ProductID === item.ProductID);
      
      // 找不到 ID 的處理 (Mock 模式)
      if (!mockProduct) {
        return res.status(400).json({ message: `找不到 ID 為 ${item.ProductID} 的商品` });
      }

      const Price = parseFloat(mockProduct.Price);
      const ItemSubtotal = Price * item.Quantity;
      Subtotal += ItemSubtotal;
      
      Items.push({
        ProductID: item.ProductID,
        ProductName: mockProduct.ProductName,
        Price: Price,
        Quantity: item.Quantity,
        ItemSubtotal: ItemSubtotal
      });
    }

    const Discount = Subtotal > 1000 ? 100 : 0;
    const ShippingFee = Subtotal > 1500 ? 0 : 60;
    const TotalAmount = Subtotal - Discount + ShippingFee;

    return res.json({
      Items,
      Subtotal,
      Discount,
      ShippingFee,
      TotalAmount,
      Mode: 'Mock'
    });
  }

  try {
    const ProductModel = db.Product;
    const productIds = CartItems.map(item => item.ProductID);
    const products = await ProductModel.findAll({
      where: { ProductID: productIds }
    });

    // 檢查是否所有商品都存在
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.ProductID);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({ message: `找不到 ID 為 ${missingIds.join(', ')} 的商品` });
    }

    let Subtotal = 0;
    const resultItems = [];

    for (const item of CartItems) {
      const product = products.find(p => p.ProductID === item.ProductID);
      
      // 檢查庫存
      if (product.Stock < item.Quantity) {
        return res.status(400).json({ 
          message: `商品 [${product.ProductID}] 庫存不足。剩餘庫存: ${product.Stock}` 
        });
      }

      const Price = parseFloat(product.Price);
      const ItemSubtotal = Price * item.Quantity;
      Subtotal += ItemSubtotal;

      resultItems.push({
        ProductID: item.ProductID,
        ProductName: product.ProductName || '商品',
        Price: Price,
        Quantity: item.Quantity,
        ItemSubtotal: ItemSubtotal
      });
    }

    const Discount = Subtotal > 1000 ? 100 : 0;
    const ShippingFee = Subtotal > 1500 ? 0 : 60;
    const TotalAmount = Subtotal - Discount + ShippingFee;

    return res.json({
      Items: resultItems,
      Subtotal,
      Discount,
      ShippingFee,
      TotalAmount
    });
  } catch (error) {
    console.error('Checkout calculate error:', error);
    return res.status(500).json({ message: '計算失敗', error: error.message });
  }
};

/**
 * 🚀 結帳並建立訂單 (遷移自 orderController)
 */
exports.checkout = async (req, res) => {
  const sequelizeInstance = db.sequelize;
  const OrderModel = db.Order;
  const OrderDetailModel = db.Orderdetail || db.OrderDetail; 
  const ProductModel = db.Product;

  let t;
  try {
    if (!sequelizeInstance) {
      throw new Error("資料庫連線實例未定義，請檢查 models/index.js");
    }

    // --- 🚀 開始資料庫交易 ---
    t = await sequelizeInstance.transaction();

    const body = req.body || {};
    
    // 支援雙命名 (PascalCase / camelCase) 與 購物車欄位兼容性
    const SellerID = body.SellerID !== undefined ? body.SellerID : body.sellerId;
    const BuyerName = body.BuyerName !== undefined ? body.BuyerName : body.buyerName;
    const BuyerPhone = body.BuyerPhone !== undefined ? body.BuyerPhone : body.buyerPhone;
    const BuyerEmail = body.BuyerEmail !== undefined ? body.BuyerEmail : body.buyerEmail;
    const BuyerAddress = body.BuyerAddress !== undefined ? body.BuyerAddress : body.buyerAddress;
    const rawItems = body.items || body.Items || body.CartItems || body.cartItems || [];
    const UTM_Source = body.UTM_Source !== undefined ? body.UTM_Source : body.utm_source;
    const SessionID = body.SessionID !== undefined ? body.SessionID : body.sessionId;

    if (!rawItems || rawItems.length === 0) throw new Error("購物車項目不可為空");

    let totalAmount = 0;
    const details = [];

    // --- 📦 處理庫存檢查與扣除 ---
    for (const item of rawItems) {
      const ProductID = item.ProductID !== undefined ? item.ProductID : item.productId;
      const Quantity = item.Quantity !== undefined ? item.Quantity : item.quantity;

      if (!ProductID) throw new Error("商品 ID 缺失");
      
      const product = await ProductModel.findByPk(ProductID, { transaction: t });
      if (!product) throw new Error(`找不到商品 ID: ${ProductID}`);
      if (product.Stock < Quantity) throw new Error(`${product.ProductName || '商品'} 庫存不足`);

      // 執行扣庫存
      product.Stock -= Quantity;
      await product.save({ transaction: t });

      const price = parseFloat(product.Price || 0);
      totalAmount += price * Quantity;
      
      details.push({ ProductID, Quantity, UnitPrice: price });
    }

    // --- 📝 建立訂單主檔 ---
    const newOrder = await OrderModel.create({
      SellerID, BuyerName, BuyerPhone, BuyerEmail, BuyerAddress,
      TotalAmount: totalAmount,
      OrderStatus: 0,
      PaymentStatus: 0,
      UTM_Source,
      SessionID
    }, { transaction: t });

    // --- 📑 建立訂單明細 ---
    const finalDetails = details.map(d => ({ ...d, OrderID: newOrder.OrderID }));
    await OrderDetailModel.bulkCreate(finalDetails, { transaction: t });

    // --- ✅ 提交所有變更 ---
    await t.commit();

    res.status(201).json({ 
      Success: true, 
      OrderID: newOrder.OrderID, 
      TotalAmount: totalAmount 
    });

  } catch (error) {
    if (t) await t.rollback();
    console.error('🔴 結帳失敗:', error);
    res.status(500).json({ Success: false, error: error.message });
  }
};

