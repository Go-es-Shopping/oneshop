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

  // 🌟 Order ↔ Shipment 聯動更新：Transaction + Shipment 自動補建 + 狀態/時間同步
  updateOrderStatus: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const orderId = Number(req.params.OrderID);

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

      const order = await Order.findByPk(orderId, { transaction: t });
      if (!order) {
        await t.rollback();
        return res.status(404).json({ Success: false, Error: '找不到該筆訂單' });
      }

      const VALID_SHIPMENT_STATUS = new Set([0, 1, 2, 3, 4, 5, 9]);

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

      await t.commit();
      const updatedOrder = await Order.findOne({ where: { OrderID: orderId } });
      res.json({ Success: true, Data: updatedOrder, Message: 'Order 與 Shipment 已同步更新' });
    } catch (error) {
      await t.rollback();
      console.error('更新訂單狀態錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 🌟 查詢單一訂單的所有明細（已透過 JOIN pagecontent 抓取真實商品名稱）
  getOrderDetailsList: async (req, res) => {
    try {
      const orderId = req.params.OrderID;

      const details = await sequelize.query(`
        SELECT od.*, pc.ProductName, pc.PageTitle 
        FROM Orderdetail od
        LEFT JOIN pagecontent pc ON od.ProductID = pc.ProductID AND pc.LanguageCode = 'zh-TW'
        WHERE od.OrderID = :orderId
        ORDER BY od.OrderdetailID ASC
      `, {
        replacements: { orderId },
        type: QueryTypes.SELECT
      });

      const formattedDetails = details.map(item => ({
        ...item,
        Product: {
          ProductName: item.ProductName || `商品 #${item.ProductID}`,
          ProductImg: item.ProductImg || 'https://via.placeholder.com/40'
        }
      }));

      res.json(formattedDetails);
    } catch (error) {
      console.error('查詢訂單明細錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 🌟 查詢單一訂單明細（包含主訂單與帶有真實商品名稱的明細）
  getOrderDetail: async (req, res) => {
    try {
      const orderId = req.params.OrderID;

      const order = await Order.findOne({
        where: { OrderID: orderId }
      });

      if (!order) {
        return res.status(404).json({ Success: false, Error: '找不到該筆訂單' });
      }

      const details = await sequelize.query(`
        SELECT od.*, pc.ProductName, pc.PageTitle 
        FROM Orderdetail od
        LEFT JOIN pagecontent pc ON od.ProductID = pc.ProductID AND pc.LanguageCode = 'zh-TW'
        WHERE od.OrderID = :orderId
      `, {
        replacements: { orderId },
        type: QueryTypes.SELECT
      });

      const formattedDetails = details.map(item => ({
        ...item,
        Product: {
          ProductName: item.ProductName || `商品 #${item.ProductID}`,
          ProductImg: item.ProductImg || 'https://via.placeholder.com/40'
        }
      }));

      const responseData = order.toJSON();
      responseData.Orderdetails = formattedDetails;

      res.json(responseData);
    } catch (error) {
      console.error('查詢訂單明細錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 刪除訂單與對應明細
  deleteOrder: async (req, res) => {
    try {
      const orderId = req.params.OrderID;

      const order = await Order.findOne({ where: { OrderID: orderId } });
      if (!order) {
        return res.status(404).json({ Success: false, Error: '找不到此訂單' });
      }

      await Orderdetail.destroy({ where: { OrderID: orderId } });
      await Order.destroy({ where: { OrderID: orderId } });

      res.json({ Success: true, Message: '刪除成功' });
    } catch (error) {
      console.error('刪除訂單錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  }
};

module.exports = sellerOrderController;