const { Order, Orderdetail, Product, Shipment, Payment, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// 一、定義狀態常數
const ORDER_STATUS = {
  PENDING_PAYMENT: 0, // 待付款
  PREPARING: 1,      // 備貨中
  SHIPPED: 2,        // 已出貨
  DELIVERED: 3,      // 已送達
  CANCELLED: 9       // 已取消
};

const orderController = {
  // 二、建立訂單 (POST /api/orders)
  createOrder: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { 
        SellerID, BuyerName, BuyerPhone, BuyerEmail, BuyerAddress, 
        items, UTM_Source, SessionID,
        ShippingMethod, StoreInfo 
      } = req.body;

      if (!items || items.length === 0) throw new Error("購物車不可為空");

      let subTotal = 0; // 修正 1：宣告 subTotal
      const details = [];

      for (const item of items) {
        const product = await Product.findByPk(item.ProductID, { transaction: t });
        
        console.log(`商品 ID ${item.ProductID} 單價:`, product ? product.Price : '找不到商品');

        if (!product) throw new Error(`找不到商品 ID: ${item.ProductID}`);
        if (product.Stock < item.Quantity) throw new Error(`${product.ProductName} 庫存不足`);

        product.Stock -= item.Quantity;
        await product.save({ transaction: t });

        subTotal += product.Price * item.Quantity;
        details.push({
          ProductID: item.ProductID,
          Quantity: item.Quantity,
          UnitPrice: product.Price
        });
      }

      // 運費計算
      let shippingFee = (ShippingMethod === '宅配') ? 100 : 60;
      if (subTotal >= 1000) shippingFee = 0;

      const totalAmount = subTotal + shippingFee; // 修正 2：不要用 const 重複宣告，直接賦值或改用 let

      console.log('--- 金額計算過程 ---');
      console.log('商品小計 (subTotal):', subTotal);
      console.log('運費 (shippingFee):', shippingFee);
      console.log('總計 (totalAmount):', totalAmount);
      console.log('------------------');

      // 建立訂單
      const newOrder = await Order.create({
        SellerID: SellerID || 15, // 修正 3：改用正確的參數
        BuyerName, BuyerPhone, BuyerEmail, BuyerAddress,
        TotalAmount: totalAmount,
        OrderStatus: ORDER_STATUS.PENDING_PAYMENT,
        PaymentStatus: 0,
        UTM_Source: UTM_Source || null,
        SessionID: SessionID || null
      }, { transaction: t });

      // 建立物流
      await Shipment.create({
        OrderID: newOrder.OrderID,
        ShippingMethod,
        StoreInfo: StoreInfo || null,
        ShippingStatus: 0
      }, { transaction: t });

      const finalDetails = details.map(d => ({ ...d, OrderID: newOrder.OrderID }));
      await Orderdetail.bulkCreate(finalDetails, { transaction: t });

      await t.commit();
      res.status(201).json({ 
        Success: true, 
        OrderID: newOrder.OrderID, 
        SubTotal: subTotal,
        ShippingFee: shippingFee,
        TotalAmount: totalAmount
      });
    } catch (error) {
      await t.rollback();
      res.status(400).json({ Success: false, Error: error.message });
    }
  },

  // 2. 查詢賣家訂單清單 (GET /api/orders)
  getSellerOrders: async (req, res) => {
    try {
      const { SellerID, OrderStatus } = req.query;
      const whereCondition = {};
      if (SellerID) whereCondition.SellerID = SellerID;
      if (OrderStatus !== undefined && OrderStatus !== null && OrderStatus !== '') {
        const num = Number(OrderStatus);
        if (!isNaN(num)) whereCondition.OrderStatus = num;
      }

      const orders = await Order.findAll({
        where: whereCondition,
        order: [['CreatedAt', 'DESC']]
      });
      res.json(orders);
    } catch (error) {
      console.error('查詢訂單列表錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 3. 取得單筆詳細 (GET /api/orders/:OrderID)
  getOrderDetail: async (req, res) => {
    try {
      const order = await Order.findByPk(req.params.OrderID, {
        include: [
          { model: Shipment },
          { model: Payment }
        ]
      });
      if (!order) return res.status(404).json({ Success: false, Message: "找不到該訂單" });
      const plain = order.toJSON();
      res.json(plain);
    } catch (error) {
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 3.5. 查詢單筆訂單的「明細列表」
  getOrderDetailsList: async (req, res) => {
    try {
      const orderId = Number(req.params.OrderID);
      if (isNaN(orderId)) return res.status(400).json({ Success: false, Error: 'OrderID 必須是數字' });

      const sql = `
        SELECT OrderdetailID, OrderID, ProductID, Quantity, UnitPrice 
        FROM Orderdetail 
        WHERE OrderID = :orderId 
        ORDER BY OrderdetailID ASC
      `;
      
      const details = await sequelize.query(sql, {
        replacements: { orderId },
        type: QueryTypes.SELECT
      });

      for (let item of details) {
        item.ProductName = `商品 #${item.ProductID}`;
        item.ProductImg = '';
        try {
          const prods = await sequelize.query(`SELECT TOP 1 * FROM Product WHERE ProductID = :productId`, {
            replacements: { productId: item.ProductID },
            type: QueryTypes.SELECT
          });
          if (prods && prods.length > 0) {
            const p = prods[0];
            item.ProductName = p.ProductName || p.Name || p.Title || `商品 #${item.ProductID}`;
            item.ProductImg = p.ProductImg || p.ProductImage || p.Img || '';
          }
        } catch (e) {}
      }

      const order = await Order.findByPk(orderId, { attributes: ['OrderID', 'TotalAmount', 'CreatedAt'] });
      res.json({
        Order: order || null,
        Orderdetails: details,
        Items: details
      });
    } catch (error) {
      console.error('查詢訂單明細列表錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 4. 更新狀態 (PATCH /api/orders/:OrderID/status)
  updateStatus: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const orderId = Number(req.params.OrderID);
      const { OrderStatus, PaymentStatus } = req.body || {};

      if (OrderStatus === undefined && PaymentStatus === undefined) {
        await t.rollback();
        return res.status(400).json({ Success: false, Error: "缺少參數" });
      }

      const order = await Order.findByPk(orderId, { transaction: t });
      if (!order) {
        await t.rollback();
        return res.status(404).json({ Success: false, Error: "找不到該訂單" });
      }

      // 修正 4：如果要回補庫存，必須去資料庫把該訂單的明細撈出來
      if (Number(OrderStatus) === ORDER_STATUS.CANCELLED) {
        const orderItems = await Orderdetail.findAll({ where: { OrderID: orderId }, transaction: t });
        for (const item of orderItems) {
          await Product.increment('Stock', {
            by: item.Quantity,
            where: { ProductID: item.ProductID },
            transaction: t
          });
        }
      }

      // 整理要更新的欄位
      const updateData = {};
      if (OrderStatus !== undefined) updateData.OrderStatus = Number(OrderStatus);
      if (PaymentStatus !== undefined) updateData.PaymentStatus = Number(PaymentStatus);

      // 修正 5：把 orderID 改成正確的小寫 orderId
      await Order.update(updateData, { where: { OrderID: orderId }, transaction: t });
      
      await t.commit();
      // 修正 6：改回正確的成功提示文字
      res.json({ Success: true, Message: '更新狀態成功' });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ Success: false, Error: error.message });
    }
  }
};

module.exports = orderController;