const { Order, Orderdetail } = require('../models');

const sellerOrderController = {
  // 專門為你的賣家後台設計的訂單列表查詢
  getSellerOrders: async (req, res) => {
    try {
      const sellerId = req.query.SellerID || 15;
      
      const orders = await Order.findAll({
        where: { SellerID: sellerId },
        order: [['CreatedAt', 'DESC']]
      });
      res.json(orders);
    } catch (error) {
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