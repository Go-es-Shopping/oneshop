const { Order, OrderDetail, Product, Payment, Shipment } = require('../models');

const SellerOrderController = {
  // 1. 查詢賣家的所有訂單列表
  getSellerOrders: async (req, res) => {
    try {
      const sellerId = req.query.sellerId;
      let whereCondition = {};
      if (sellerId) {
        whereCondition.SellerID = sellerId;
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

      // 引入 PageContent 模型（如果妳檔案最上方還沒引入，記得在頂端 require 或者是確保 models 裡有 PageContent）
      const { PageContent } = require('../models');

      const result = await Promise.all(details.map(async (item) => {
        let productName = `商品 #${item.ProductID}`;
        
        if (item.ProductID) {
          // 改從 PageContent 這張表用 ProductID 去找
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
  }
};

module.exports = SellerOrderController;
