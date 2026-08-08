const { Order, Orderdetail, Shipment, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

const sellerOrderController = {
  // 專門為你的賣家後台設計的訂單列表查詢（支援 OrderStatus 篩選）
  getSellerOrders: async (req, res) => {
    try {
      const sellerId = req.query.SellerID || 15;
      const orderStatus = req.query.OrderStatus;

      const whereClause = { SellerID: sellerId };
      if (orderStatus !== undefined && orderStatus !== null && orderStatus !== '') {
        whereClause.OrderStatus = Number(orderStatus);
      }

      const orders = await Order.findAll({
        where: whereClause,
        order: [['CreatedAt', 'DESC']]
      });
      res.json(orders);
    } catch (error) {
      console.error('查詢訂單列表錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 🌟 Order ↔ Shipment 聯動更新：Transaction + Shipment 自動補建 + 狀態/時間同步（與 orderController 邏輯一致）
  updateOrderStatus: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const orderId = Number(req.params.OrderID);

      // 容錯處理：同時支援前端傳入 OrderStatus, orderStatus 或 status
      const rawOrderStatus = req.body.OrderStatus !== undefined ? req.body.OrderStatus : (req.body.orderStatus !== undefined ? req.body.orderStatus : req.body.status);
      const rawPaymentStatus = req.body.PaymentStatus !== undefined ? req.body.PaymentStatus : req.body.paymentStatus;
      const trackingNumber = req.body.TrackingNumber;

      if (rawOrderStatus === undefined && rawPaymentStatus === undefined) {
        await t.rollback();
        return res.status(400).json({ Success: false, Error: '缺少要更新的狀態參數' });
      }
      if (isNaN(orderId)) {
        await t.rollback();
        return res.status(400).json({ Success: false, Error: 'OrderID 必須是有效的數字' });
      }

      // --- 步驟 1：確認訂單存在 ---
      const order = await Order.findByPk(orderId, { transaction: t });
      if (!order) {
        await t.rollback();
        return res.status(404).json({ Success: false, Error: '找不到該筆訂單' });
      }

      // --- 步驟 1.5：狀態對應表 (OrderStatus INT ↔ ShipmentStatus INT，兩表一致) ---
      // 0=處理中 / 1=待出貨 / 2=已出貨 / 3=已送達 / 4=完成取貨 / 5=已取消
      const VALID_SHIPMENT_STATUS = new Set([0, 1, 2, 3, 4, 5, 9]);

      // --- 步驟 2：更新 Order 表（UpdatedAt=GETDATE() 解決 MSSQL date conversion） ---
      let orderSetClauses = [];
      let orderReplacements = { orderId };
      if (rawOrderStatus !== undefined && rawOrderStatus !== null) {
        const num = Number(rawOrderStatus);
        if (isNaN(num)) {
          await t.rollback();
          return res.status(400).json({ Success: false, Error: 'OrderStatus 必須是有效的數字' });
        }
        orderSetClauses.push('OrderStatus = :orderStatus');
        orderReplacements.orderStatus = num;
      }
      if (rawPaymentStatus !== undefined && rawPaymentStatus !== null) {
        const num = Number(rawPaymentStatus);
        if (isNaN(num)) {
          await t.rollback();
          return res.status(400).json({ Success: false, Error: 'PaymentStatus 必須是有效的數字' });
        }
        orderSetClauses.push('PaymentStatus = :paymentStatus');
        orderReplacements.paymentStatus = num;
      }
      orderSetClauses.push('UpdatedAt = GETDATE()');

      const orderSql = `UPDATE [Order] SET ${orderSetClauses.join(', ')} WHERE OrderID = :orderId`;
      await sequelize.query(orderSql, {
        replacements: orderReplacements,
        type: QueryTypes.UPDATE,
        transaction: t
      });

      // --- 步驟 3：同步更新 Shipment 表（同 Transaction） ---
      if (rawOrderStatus !== undefined && rawOrderStatus !== null) {
        const numOrderStatus = Number(rawOrderStatus);
        if (VALID_SHIPMENT_STATUS.has(numOrderStatus)) {
          const existingShipment = await Shipment.findOne({ where: { OrderID: orderId }, transaction: t });

          if (existingShipment) {
            let shipmentSet = ['ShipmentStatus = :shipmentStatus'];
            let shipmentReps = { orderId, shipmentStatus: numOrderStatus };
            if (typeof trackingNumber === 'string' && trackingNumber.trim() !== '') {
              shipmentSet.push('TrackingNumber = :trackingNumber');
              shipmentReps.trackingNumber = trackingNumber.trim();
            }
            if (numOrderStatus === 2) shipmentSet.push('ShippedAt = GETDATE()');
            const shipmentSql = `UPDATE Shipment SET ${shipmentSet.join(', ')} WHERE OrderID = :orderId`;
            await sequelize.query(shipmentSql, {
              replacements: shipmentReps,
              type: QueryTypes.UPDATE,
              transaction: t
            });
          } else {
            // 舊訂單無 Shipment → 自動補建（TrackingNumber 是 NOT NULL，沒傳就 PENDING 占位）
            const fallbackTracking = (typeof trackingNumber === 'string' && trackingNumber.trim() !== '') ? trackingNumber.trim() : 'PENDING';
            const shippingMethod = order.BuyerAddress && String(order.BuyerAddress).includes('超商') ? '超商取貨' : '宅配';
            const shippedAtExpr = numOrderStatus === 2 ? 'GETDATE()' : 'NULL';
            const insertSql = `
              INSERT INTO Shipment (OrderID, ShippingMethod, TrackingNumber, ShipmentStatus, ShippedAt)
              VALUES (:orderId, :shippingMethod, :trackingNumber, :shipmentStatus, ${shippedAtExpr})
            `;
            await sequelize.query(insertSql, {
              replacements: {
                orderId,
                shippingMethod,
                trackingNumber: fallbackTracking,
                shipmentStatus: numOrderStatus
              },
              type: QueryTypes.INSERT,
              transaction: t
            });
          }
        }
      }

      // --- 步驟 4：Commit ---
      await t.commit();
      const updatedOrder = await Order.findOne({ where: { OrderID: orderId } });
      res.json({ Success: true, Data: updatedOrder, Message: 'Order 與 Shipment 已同步更新' });
    } catch (error) {
      await t.rollback();
      console.error('更新訂單狀態錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 查詢單一訂單的所有明細
  getOrderDetailsList: async (req, res) => {
    try {
      const orderId = req.params.OrderID;

      const details = await Orderdetail.findAll({
        where: { OrderID: orderId },
        order: [['OrderdetailID', 'ASC']]
      });

      res.json(details);
    } catch (error) {
      console.error('查詢訂單明細錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 查詢單一訂單明細
  getOrderDetail: async (req, res) => {
    try {
      const orderId = req.params.OrderID;

      // 1. 先撈主訂單
      const order = await Order.findOne({
        where: { OrderID: orderId }
      });

      if (!order) {
        return res.status(404).json({ Success: false, Error: '找不到該筆訂單' });
      }

      // 2. 再獨立撈出該訂單的所有明細
      const details = await Orderdetail.findAll({
        where: { OrderID: orderId }
      });

      // 3. 把主訂單轉成 JSON，並手動塞入 Orderdetails 陣列讓前端接收
      const responseData = order.toJSON();
      responseData.Orderdetails = details;

      res.json(responseData);
    } catch (error) {
      console.error('查詢訂單明細錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 🌟 刪除訂單與對應明細
  deleteOrder: async (req, res) => {
    try {
      const orderId = req.params.OrderID;

      // 1. 檢查該訂單是否存在
      const order = await Order.findOne({ where: { OrderID: orderId } });
      if (!order) {
        return res.status(404).json({ Success: false, Error: '找不到此訂單' });
      }

      // 2. 先刪除該訂單底下的「訂單明細 (Orderdetail)」
      await Orderdetail.destroy({ where: { OrderID: orderId } });

      // 3. 再刪除主訂單 (Order)
      await Order.destroy({ where: { OrderID: orderId } });

      res.json({ Success: true, Message: '刪除成功' });
    } catch (error) {
      console.error('刪除訂單錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  }
};

module.exports = sellerOrderController;