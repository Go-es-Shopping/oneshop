const { Order, Orderdetail, Product, Shipment, Payment, sequelize } = require('../models');

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
        const product = await Product.findByPk(item.ProductID, { transaction: t });
        if (!product) throw new Error(`找不到商品 ID: ${item.ProductID}`);
        if (product.Stock < item.Quantity) throw new Error(`${product.ProductName} 庫存不足`);

        product.Stock -= item.Quantity;
        await product.save({ transaction: t });

        totalAmount += product.Price * item.Quantity;
        details.push({
          ProductID: item.ProductID,
          Quantity: item.Quantity,
          UnitPrice: product.Price
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
      const { SellerID } = req.query;
      const orders = await Order.findAll({
        where: SellerID ? { SellerID } : {},
        order: [['CreatedAt', 'DESC']]
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 3. 取得單筆詳細 (GET /api/orders/:OrderID)
  getOrderDetail: async (req, res) => {
    try {
      const order = await Order.findByPk(req.params.OrderID, {
        include: [
          { 
            model: Orderdetail, 
            as: 'Items', 
            include: [Product] 
          },
          { model: Shipment },
          { model: Payment }
        ]
      });
      if (!order) return res.status(404).json({ Success: false, Message: "找不到該訂單" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 4. 更新狀態 (PATCH /api/orders/:OrderID/status)
  updateStatus: async (req, res) => {
    try {
      const { OrderStatus } = req.body;
      if (OrderStatus === undefined) throw new Error("缺少 OrderStatus 參數");
      
      await Order.update({ OrderStatus }, { where: { OrderID: req.params.OrderID } });
      res.json({ Success: true, Message: '狀態更新成功' });
    } catch (error) {
      res.status(500).json({ Success: false, Error: error.message });
    }
  }
};

module.exports = orderController;