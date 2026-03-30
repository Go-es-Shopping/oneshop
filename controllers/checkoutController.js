const { Product } = require('../models/index');
const sequelize = require('../config/database');
const { readMock } = require('../src/mocks/utils');

/**
 * 模擬判定邏輯 (與 seller/admin controller 保持一致)
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

exports.calculate = async (req, res) => {
  const { cartItems } = req.body || {};

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ message: '購物車內容不可為空' });
  }

  // 新增檢查：商品數量必須大於 0
  for (const item of cartItems) {
    if (item.quantity <= 0) {
      return res.status(400).json({ message: '商品數量必須大於 0' });
    }
  }

  const isMock = await useMock();

  if (isMock) {
    // Mock 模式：從 mock 檔案讀取
    const mockProducts = readMock('product.json').list;
    let subtotal = 0;
    const items = [];

    for (const item of cartItems) {
      const mockProduct = mockProducts.find(p => p.ProductID === item.productId);
      
      // 找不到 ID 的處理 (Mock 模式)
      if (!mockProduct) {
        return res.status(400).json({ message: `找不到 ID 為 ${item.productId} 的商品` });
      }

      const price = parseFloat(mockProduct.Price);
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      
      items.push({
        productId: item.productId,
        productName: mockProduct.ProductName,
        price: price,
        quantity: item.quantity,
        itemSubtotal: itemSubtotal
      });
    }

    const discount = subtotal > 1000 ? 100 : 0;
    const shippingFee = subtotal > 1500 ? 0 : 60;
    const totalAmount = subtotal - discount + shippingFee;

    return res.json({
      items,
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      mode: 'Mock'
    });
  }

  try {
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.findAll({
      where: { ProductID: productIds }
    });

    // 檢查是否所有商品都存在
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.ProductID);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({ message: `找不到 ID 為 ${missingIds.join(', ')} 的商品` });
    }

    let subtotal = 0;
    const resultItems = [];

    for (const item of cartItems) {
      const product = products.find(p => p.ProductID === item.productId);
      
      // 檢查庫存
      if (product.Stock < item.quantity) {
        return res.status(400).json({ 
          message: `商品 [${product.ProductID}] 庫存不足。剩餘庫存: ${product.Stock}` 
        });
      }

      const price = parseFloat(product.Price);
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      resultItems.push({
        productId: product.ProductID,
        price: price,
        quantity: item.quantity,
        itemSubtotal: itemSubtotal
      });
    }

    // 計算邏輯
    // 1. 折扣 (Discount)：若 subtotal > 1000，折抵 100 元
    const discount = subtotal > 1000 ? 100 : 0;
    
    // 2. 運費 (Shipping)：預設 60 元，若 subtotal > 1500 則免運
    const shippingFee = subtotal > 1500 ? 0 : 60;
    
    // 3. 總計
    const totalAmount = subtotal - discount + shippingFee;

    return res.json({
      items: resultItems,
      subtotal,
      discount,
      shippingFee,
      totalAmount
    });

  } catch (error) {
    console.error('Checkout calculation error:', error);
    return res.status(500).json({ message: '計算過程中發生錯誤', error: error.message });
  }
};
