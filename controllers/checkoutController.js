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
    const productIds = CartItems.map(item => item.ProductID);
    const products = await Product.findAll({
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
