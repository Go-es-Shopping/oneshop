const { Order, Orderdetail, Shipment, Payment, sequelize } = require('../models');

const orderController = {
  // 1. 建立訂單 (POST /api/orders)
  createOrder: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { SellerID, BuyerName, BuyerPhone, BuyerEmail, BuyerAddress, items } = req.body;
      if (!items || items.length === 0) throw new Error("Quantity 必須大於 0");

      let totalAmount = 0;
      const details = [];

      for (const item of items) {
        totalAmount += (item.UnitPrice || 0) * item.Quantity;
        details.push({
          ProductID: item.ProductID,
          Quantity: item.Quantity,
          UnitPrice: item.UnitPrice || 0
        });
      }

      const newOrder = await Order.create({
        SellerID, BuyerName, BuyerPhone, BuyerEmail, BuyerAddress,
        TotalAmount: totalAmount,
        OrderStatus: 0,
        PaymentStatus: 0
      }, { transaction: t });

      const finalDetails = details.map(d => ({ ...d, OrderID: newOrder.OrderID }));
      await Orderdetail.bulkCreate(finalDetails, { transaction: t });

      await t.commit();
      res.status(201).json({ 
        Success: true, 
        OrderID: newOrder.OrderID, 
        TotalAmount: totalAmount,
        Items: finalDetails 
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

  // 3.5. 查詢單筆訂單的「明細列表」(GET /api/orders/:OrderID/details) - 絕對安全版
  getOrderDetailsList: async (req, res) => {
    try {
      const { QueryTypes } = require('sequelize');
      const orderId = Number(req.params.OrderID);
      if (isNaN(orderId)) return res.status(400).json({ Success: false, Error: 'OrderID 必須是數字' });

      // 只抓 Orderdetail 本身的欄位，絕對不會因為 Product 資料表欄位不合而噴 500
      const sql = `
        SELECT
          OrderdetailID,
          OrderID,
          ProductID,
          Quantity,
          UnitPrice
        FROM Orderdetail
        WHERE OrderID = :orderId
        ORDER BY OrderdetailID ASC
      `;
      
      const details = await sequelize.query(sql, {
        replacements: { orderId },
        type: QueryTypes.SELECT
      });

      // 動態補上商品名稱與圖片（安全防呆）
      for (let item of details) {
        item.ProductName = `商品 #${item.ProductID}`;
        item.ProductImg = '';
        try {
          const prodSql = `SELECT TOP 1 * FROM Product WHERE ProductID = :productId`;
          const prods = await sequelize.query(prodSql, {
            replacements: { productId: item.ProductID },
            type: QueryTypes.SELECT
          });
          if (prods && prods.length > 0) {
            const p = prods[0];
            item.ProductName = p.ProductName || p.Name || p.Title || `商品 #${item.ProductID}`;
            item.ProductImg = p.ProductImg || p.ProductImage || p.Img || '';
          }
        } catch (e) {
          // 略過錯誤，維持預設名稱
        }
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
      const { OrderStatus, PaymentStatus, TrackingNumber } = req.body || {};

      if (OrderStatus === undefined && PaymentStatus === undefined) {
        await t.rollback();
        return res.status(400).json({ Success: false, Error: "缺少參數" });
      }

      const order = await Order.findByPk(orderId, { transaction: t });
      if (!order) {
        await t.rollback();
        return res.status(404).json({ Success: false, Error: "找不到該訂單" });
      }

      let orderSetClauses = [];
      let orderReplacements = { orderId };

      if (OrderStatus !== undefined) {
        orderSetClauses.push('OrderStatus = :orderStatus');
        orderReplacements.orderStatus = Number(OrderStatus);
      }
      if (PaymentStatus !== undefined) {
        orderSetClauses.push('PaymentStatus = :paymentStatus');
        orderReplacements.paymentStatus = Number(PaymentStatus);
      }
      orderSetClauses.push('UpdatedAt = GETDATE()');

      const { QueryTypes } = require('sequelize');
      await sequelize.query(`UPDATE [Order] SET ${orderSetClauses.join(', ')} WHERE OrderID = :orderId`, {
        replacements: orderReplacements,
        type: QueryTypes.UPDATE,
        transaction: t
      });

      await t.commit();
      res.json({ Success: true, Message: '狀態更新成功' });
    } catch (error) {
      await t.rollback();
      console.error('更新訂單狀態錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 5. 刪除訂單 (DELETE /api/orders/:OrderID)
  deleteOrder: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const orderId = req.params.OrderID;
      const order = await Order.findByPk(orderId, { transaction: t });
      if (!order) {
        await t.rollback();
        return res.status(404).json({ Success: false, Error: "找不到該訂單" });
      }

      await Shipment.destroy({ where: { OrderID: orderId }, transaction: t });
      await Payment.destroy({ where: { OrderID: orderId }, transaction: t });
      await Orderdetail.destroy({ where: { OrderID: orderId }, transaction: t });
      await Order.destroy({ where: { OrderID: orderId }, transaction: t });

      await t.commit();
      res.json({ Success: true, Message: '刪除成功' });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ Success: false, Error: error.message });
    }
  }
};

module.exports = orderController;