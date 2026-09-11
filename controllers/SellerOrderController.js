const { Order, OrderDetail, Product, Payment, Shipment } = require('../models');

const SellerOrderController = {
  // 1. 查詢賣家的所有訂單列表（已加入 OrderStatus 篩選支援）
  getSellerOrders: async (req, res) => {
    try {
      // 同時相容大小寫的參數命名，避免傳遞時漏掉
      const sellerId = req.query.sellerId || req.query.SellerID;
      const orderStatus = req.query.OrderStatus || req.query.orderStatus;

      let whereCondition = {};
      
      // 如果有指定賣家 ID，加入條件
      if (sellerId) {
        whereCondition.SellerID = sellerId;
      }

      // 如果前端有傳入狀態，且不是空字串或 'all'，才加入狀態過濾條件
      if (orderStatus !== undefined && orderStatus !== '' && orderStatus !== 'all') {
        whereCondition.OrderStatus = orderStatus;
      }

      const orders = await Order.findAll({
        where: whereCondition,
        order: [['OrderID', 'DESC']]
      });

      res.json(orders);
    } catch (error) {
      console.error('查詢賣家訂單列表錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 2. 查詢單筆訂單的詳細資訊
  getOrderById: async (req, res) => {
    try {
      const orderId = req.params.OrderID;
      const order = await Order.findByPk(orderId);

      if (!order) {
        return res.status(404).json({ Success: false, Error: '找不到該訂單' });
      }

      res.json(order);
    } catch (error) {
      console.error('查詢單筆訂單錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 3. 查詢訂單明細列表（修正版：從 PageContent 抓取 ProductName）
  getOrderDetailsList: async (req, res) => {
    try {
      const orderId = req.params.OrderID;
      
      const details = await OrderDetail.findAll({ 
        where: { OrderID: orderId },
        raw: true 
      });

      const { PageContent } = require('../models');

      const result = await Promise.all(details.map(async (item) => {
        let productName = `商品 #${item.ProductID}`;
        
        if (item.ProductID) {
          const pageContent = await PageContent.findOne({
            where: { ProductID: item.ProductID },
            raw: true
          });

          if (pageContent) {
            productName = pageContent.ProductName || 
                        pageContent.product_name || 
                        `商品 #${item.ProductID}`;
          }
        }

        return {
          ...item,
          ProductName: productName
        };
      }));

      res.json(result);
    } catch (error) {
      console.error('查詢訂單明細列表錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 4. 更新訂單狀態
  updateOrderStatus: async (req, res) => {
    try {
      const orderId = req.params.OrderID;
      const { OrderStatus } = req.body;

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ Success: false, Error: '找不到該訂單' });
      }

      order.OrderStatus = OrderStatus;
      await order.save();

      res.json({ Success: true, Message: '訂單狀態更新成功', order });
    } catch (error) {
      console.error('更新訂單狀態錯誤:', error);
      res.status(500).json({ Success: false, Error: error.message });
    }
  },
  // 5. 刪除指定訂單（完整級聯刪除：明細、付款、物流）
  deleteOrder: async (req, res) => {
    try {
      const orderId = req.params.OrderID;
      
      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ Success: false, Error: '找不到該訂單' });
      }

      // 1. 刪除訂單明細
      await OrderDetail.destroy({ where: { OrderID: orderId } });

      // 2. 刪除付款記錄 (Payment)
      if (Payment) {
        await Payment.destroy({ where: { OrderID: orderId } });
      }

      // 3. 刪除物流記錄 (Shipment)
      if (Shipment) {
        await Shipment.destroy({ where: { OrderID: orderId } });
      }

      // 4. 最後刪除主訂單
      await order.destroy();

      return res.json({ Success: true, Message: '訂單與相關記錄刪除成功' });
    } catch (error) {
      console.error('刪除訂單發生嚴重錯誤:', error);
      return res.status(500).json({ Success: false, Error: error.message });
    }
  }
};


module.exports = SellerOrderController;