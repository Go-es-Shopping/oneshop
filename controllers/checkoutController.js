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
  // 💡 確保引入 Shipment 與 Payment 模型
  const ShipmentModel = db.Shipment;
  const PaymentModel = db.Payment;
  const StorePageModel = db.StorePage;

  let t;
  try {
    if (!sequelizeInstance) {
      throw new Error("資料庫連線實例未定義，請檢查 models/index.js");
    }

    // --- 🚀 開始資料庫交易 ---
    t = await sequelizeInstance.transaction();

    const body = req.body || {};
    
    // 💡 印出前端傳來的完整內容，方便對照除錯
    console.log('🔍 收到前端結帳請求 req.body:', JSON.stringify(body, null, 2));

    // 支援雙命名 (PascalCase / camelCase)
    const PageID = body.PageID !== undefined ? body.PageID : body.pageId;
    let SellerID = body.SellerID !== undefined ? body.SellerID : body.sellerId;
    const BuyerName = body.BuyerName !== undefined ? body.BuyerName : body.buyerName;
    const BuyerPhone = body.BuyerPhone !== undefined ? body.BuyerPhone : body.buyerPhone;
    const BuyerEmail = body.BuyerEmail !== undefined ? body.BuyerEmail : body.buyerEmail;
    const BuyerAddress = body.BuyerAddress !== undefined ? body.BuyerAddress : body.buyerAddress;
    const rawItems = body.items || body.Items || body.CartItems || body.cartItems || [];
    const UTM_Source = body.UTM_Source !== undefined ? body.UTM_Source : body.utm_source;
    const SessionID = body.SessionID !== undefined ? body.SessionID : body.sessionId;

    // 物流與付款相關欄位接收
    const ShippingMethod = body.ShippingMethod || body.shippingMethod || '宅配';
    const StoreInfo = body.StoreInfo || body.storeInfo || null;
    const PaymentMethod = body.PaymentMethod || body.paymentMethod || 'CashOnDelivery';

    // --- 🎟️ 接收前端傳過來的優惠券相關資訊 ---
    const rawCouponID = body.CouponID !== undefined ? body.CouponID : body.couponId;
    let resolvedCouponID = rawCouponID ? Number(rawCouponID) : null;
    const CouponCode = body.CouponCode !== undefined ? body.CouponCode : body.couponCode;
    const DiscountValue = body.DiscountValue !== undefined ? body.DiscountValue : (body.discountValue !== undefined ? body.discountValue : 0);

    // 💡 關鍵保險：如果前端只傳了 CouponCode 卻沒傳 CouponID，我們直接去資料庫把對應的 ID 查出來！
    if (!resolvedCouponID && CouponCode && db.Coupon) {
      const foundCoupon = await db.Coupon.findOne({
        where: { CouponCode: CouponCode },
        transaction: t
      });
      if (foundCoupon) {
        resolvedCouponID = foundCoupon.CouponID; // 對應資料庫的主鍵欄位
      }
    }

    if (!rawItems || rawItems.length === 0) throw new Error("購物車項目不可為空");

    // 如果前端沒有傳 SellerID，但有傳 PageID，可以透過 StorePage 自動查出 SellerID
    if (!SellerID && PageID && StorePageModel) {
      const storePage = await StorePageModel.findByPk(PageID, { transaction: t });
      if (storePage) {
        SellerID = storePage.SellerID;
      }
    }

    let subTotal = 0;
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
      
      // 🚀 【完美電商自動下架邏輯】：如果扣完之後庫存見底 (<= 0)
      if (product.Stock <= 0) {
        product.Stock = 0;    // 確保庫存不會變成負數
        product.IsActive = 0; // 自動設為下架！
      }

      await product.save({ transaction: t });

      const price = parseFloat(product.Price || 0);
      subTotal += price * Quantity;
      
      details.push({ ProductID, Quantity, UnitPrice: price });
    }

    // 計算運費
    let shippingFee = (ShippingMethod === '宅配') ? 100 : 60;
    if (subTotal >= 1000) shippingFee = 0;

    // --- 🎟️ 計算扣除優惠券折扣後的最終金額 ---
    const discount = parseFloat(DiscountValue || 0);
    let finalTotalAmount = subTotal + shippingFee - discount;
    if (finalTotalAmount < 0) {
      finalTotalAmount = 0;
    }

    // --- 📝 建立訂單主檔 ---
    const newOrder = await OrderModel.create({
      SellerID: SellerID || 1, 
      BuyerName, 
      BuyerPhone, 
      BuyerEmail, 
      BuyerAddress,
      TotalAmount: finalTotalAmount, 
      CouponID: (isNaN(resolvedCouponID) || resolvedCouponID === 0) ? null : resolvedCouponID, // 🎟️ 寫入解析或查詢到的 CouponID
      CouponCode: CouponCode || null,     // 🎟️ 寫入優惠券代碼
      DiscountValue: discount,            // 🎟️ 寫入實際折抵金額
      OrderStatus: 0,
      PaymentStatus: 0,
      UTM_Source,
      SessionID
    }, { transaction: t });

    // --- 📑 建立訂單明細 ---
    const finalDetails = details.map(d => ({ ...d, OrderID: newOrder.OrderID }));
    await OrderDetailModel.bulkCreate(finalDetails, { transaction: t });

    // --- 🚚 建立物流記錄 (Shipment) ---
    if (ShipmentModel) {
      await ShipmentModel.create({
        OrderID: newOrder.OrderID,
        ShippingMethod: ShippingMethod,
        StoreInfo: StoreInfo,
        ShipmentStatus: 0
      }, { transaction: t });
    }

    // --- 💳 建立付款記錄 (Payment) ---
    if (PaymentModel) {
      await PaymentModel.create({
        OrderID: newOrder.OrderID,
        PaymentMethod: PaymentMethod,
        PaymentStatus: 0
      }, { transaction: t });
    }

    // --- ✅ 提交所有變更 ---
    await t.commit();

    res.status(201).json({ 
      Success: true, 
      OrderID: newOrder.OrderID, 
      TotalAmount: finalTotalAmount 
    });

  } catch (error) {
    if (t) await t.rollback();
    console.error('🔴 結帳失敗:', error);
    res.status(500).json({ Success: false, error: error.message });
  }
};