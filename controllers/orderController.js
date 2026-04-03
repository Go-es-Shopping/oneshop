const ExcelJS = require('exceljs');
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
        // 1. 檢查庫存：從資料庫抓取最新庫存並比對
        const product = await Product.findByPk(item.ProductID, { transaction: t });
        if (!product) throw new Error(`找不到商品 ID: ${item.ProductID}`);
        if (product.Stock < item.Quantity) throw new Error(`${product.ProductName} 庫存不足`);

        // 2. 計算金額：累加 totalAmount，使用資料庫的 Price 以防竄改
        totalAmount += product.Price * item.Quantity;

        // 3. 準備明細：將 ProductID、Quantity 和當時的 Price 暫存入陣列
        details.push({
          ProductID: item.ProductID,
          Quantity: item.Quantity,
          UnitPrice: product.Price
        });

        // 4. 執行庫存扣除 (Update Stock)：在交易 (transaction) 中執行
        product.Stock -= item.Quantity;
        await product.save({ transaction: t });
      }

      // 5. 建立主訂單 (Create Order)
      const newOrder = await Order.create({
        SellerID, 
        BuyerName, 
        BuyerPhone, 
        BuyerEmail, 
        BuyerAddress,
        TotalAmount: totalAmount, // 使用後端計算出的總額
        OrderStatus: 0,           // 預設狀態 (例如 0 代表 Pending)
        PaymentStatus: 0          // 預設付款狀態
      }, { transaction: t });

      // 6. 批量建立訂單明細 (Bulk Create Details)
      // 將步驟一準備好的明細陣列，每一筆都加上 newOrder.OrderID
      const finalDetails = details.map(d => ({ ...d, OrderID: newOrder.OrderID }));
      
      // 使用 Orderdetail.bulkCreate 一次性寫入所有明細，並帶入 transaction
      await Orderdetail.bulkCreate(finalDetails, { transaction: t });

      // 7. 提交事務 (Commit)
      // 只有當以上所有步驟都成功時，才會真正將更動寫入資料庫
      await t.commit();
      res.status(201).json({ 
        Success: true, 
        OrderID: newOrder.OrderID, 
        TotalAmount: totalAmount,
        Items: finalDetails 
      });
    } catch (error) {
      // 8. 回滾事務 (Rollback)
      // 如果過程中發生任何錯誤，撤銷所有已執行的資料庫更動（例如已扣除的庫存）
      await t.rollback();
      res.status(400).json({ Success: false, Error: error.message });
    }
  },

  // 更新訂單狀態
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params; // 從網址取得 OrderID
      const { status } = req.body; // 從前端傳來的 JSON 取得新狀態

      // 1. 找到該筆訂單
      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: '找不到該訂單' });
      }

      // 2. 更新狀態文字
      order.OrderStatus = status;
      await order.save();

      res.status(200).json({
        success: true,
        message: '訂單狀態更新成功',
        data: { OrderID: id, NewStatus: status }
      });
    } catch (error) {
      console.error('更新狀態出錯:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 匯出訂單 Excel 
  exportOrders: async (req, res) => { 
      try { 
          const orders = await Order.findAll(); // 抓取所有訂單 
          const workbook = new ExcelJS.Workbook(); 
          const worksheet = workbook.addWorksheet('訂單清單'); 
  
          // 設定 Excel 表頭 
          worksheet.columns = [ 
              { header: '訂單編號', key: 'OrderID', width: 10 }, 
              { header: '買家姓名', key: 'BuyerName', width: 20 }, 
              { header: '買家電話', key: 'BuyerPhone', width: 15 }, 
              { header: '收件地址', key: 'BuyerAddress', width: 30 }, 
              { header: '總金額', key: 'TotalAmount', width: 15 }, 
              { header: '狀態', key: 'OrderStatus', width: 15 } 
          ]; 
  
          // 填入資料 
          orders.forEach(order => worksheet.addRow(order.get({ plain: true }))); 
  
          // 設定瀏覽器下載回應 
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); 
          res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx'); 
  
          await workbook.xlsx.write(res); 
          res.end(); 
      } catch (error) { 
          res.status(500).send(error.message); 
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
  }
};

module.exports = orderController;
