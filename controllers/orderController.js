const { Order, Orderdetail, Product, Shipment, Payment, sequelize } = require('../models');

// 一、定義狀態常數 (組長任務：核心共享基礎)
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

      let subTotal = 0; 
      const details = [];

      for (const item of items) {
        const product = await Product.findByPk(item.ProductID, { transaction: t });
        
        // 【排查點 1】檢查有沒有抓到單價
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

      const totalAmount = subTotal + shippingFee;

      // 【排查點 2】檢查最終加總
      console.log('--- 金額計算過程 ---');
      console.log('商品小計 (subTotal):', subTotal);
      console.log('運費 (shippingFee):', shippingFee);
      console.log('總計 (totalAmount):', totalAmount);
      console.log('------------------');

      // 建立訂單
      const newOrder = await Order.create({
        SellerID, BuyerName, BuyerPhone, BuyerEmail, BuyerAddress,
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

  // 三、查詢訂單 (GET) - 任務：資料關聯優化
  getSellerOrders: async (req, res) => {
    try {
      const { SellerID } = req.query;
      const orders = await Order.findAll({
        where: SellerID ? { SellerID } : {},
        include: [Shipment, Payment], // 確保看到物流與付款狀態
        order: [['CreatedAt', 'DESC']]
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ Success: false, Error: error.message });
    }
  },

  // 四、更新狀態與物流 (PATCH /api/orders/:id/status)
  updateStatus: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { OrderStatus, TrackingNumber } = req.body;
      const orderID = req.params.OrderID;

      const order = await Order.findByPk(orderID, {
        include: [{ model: Orderdetail, as: 'Items' }]
      });
      if (!order) throw new Error("找不到該訂單");

      // 任務：狀態流轉保護 (防呆)
      if (order.OrderStatus === ORDER_STATUS.CANCELLED || order.OrderStatus === ORDER_STATUS.DELIVERED) {
        throw new Error("已取消或已送達之訂單不可更改狀態");
      }

      // 任務：填寫物流單號 (當狀態改為 2:已出貨)
      if (Number(OrderStatus) === ORDER_STATUS.SHIPPED) {
        if (!TrackingNumber) throw new Error("更動為已出貨時，必須填寫物流單號");
        await Shipment.update({ TrackingNumber }, { where: { OrderID: orderID }, transaction: t });
      }

      // 任務：關鍵例外處理 - 自動庫存回補 (狀態改為 9:已取消)
      if (Number(OrderStatus) === ORDER_STATUS.CANCELLED) {
        for (const item of order.Items) {
          await Product.increment('Stock', {
            by: item.Quantity,
            where: { ProductID: item.ProductID },
            transaction: t
          });
        }
      }

      await Order.update({ OrderStatus }, { where: { OrderID: orderID }, transaction: t });
      
      await t.commit();
      res.json({ Success: true, Message: `訂單狀態已更新為 ${OrderStatus}` });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ Success: false, Error: error.message });
    }
  }
};

module.exports = orderController;
