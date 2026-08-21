// 💡 記得確定有把 StorePage 從 ../models 引入進來
const { Order, Orderdetail, Product, Shipment, Payment, StorePage, sequelize } = require('../models');

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
        PageID, // 接收前端傳來的 PageID
        BuyerName, BuyerPhone, BuyerEmail, BuyerAddress,
        items, UTM_Source, SessionID,
        ShippingMethod, StoreInfo,
        InvoiceType, CarrierCode,
        PaymentMethod, // 💡 1. 記得接收前端傳來的付款方式
        CouponID, CouponCode, DiscountValue // 💡 接收前端傳過來的優惠券欄位
      } = req.body;

      if (!items || items.length === 0) throw new Error("購物車不可為空");
      if (!PageID) throw new Error("缺少賣場頁面編號 (PageID)");

      // ==========================================================
      // 💡 關鍵修正：透過 PageID 自動去資料庫查詢對應的 SellerID
      // ==========================================================
      const storePage = await StorePage.findByPk(PageID, { transaction: t });
      if (!storePage) {
        throw new Error(`找不到對應的賣場頁面 (PageID: ${PageID})`);
      }
      const resolvedSellerID = storePage.SellerID; // 取得該賣場真正的擁有者 ID！

      let subTotal = 0;
      const details = [];

      for (const item of items) {
        const product = await Product.findByPk(item.ProductID, { transaction: t });

        // 【排查點 1】檢查有沒有抓到單價
        console.log(`商品 ID ${item.ProductID} 單價:`, product ? product.Price : '找不到商品');

        if (!product) throw new Error(`找不到商品 ID: ${item.ProductID}`);
        if (product.Stock < item.Quantity) throw new Error(`${product.ProductName} 庫存不足`);

        // 執行扣庫存
        product.Stock -= item.Quantity;

        // 🚀 【完美電商自動下架邏輯】：如果扣完之後庫存見底 (<= 0)
        if (product.Stock <= 0) {
          product.Stock = 0;    // 確保庫存不會變成負數
          product.IsActive = 0; // 自動設為下架！
        }

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

      // 💡 優惠券折抵計算（若沒傳預設為 0）
      const discount = DiscountValue || 0;
      const totalAmount = Math.max(0, subTotal + shippingFee - discount);

      // 【排查點 2】檢查最終加總
      console.log('--- 金額計算過程 ---');
      console.log('商品小計 (subTotal):', subTotal);
      console.log('運費 (shippingFee):', shippingFee);
      console.log('優惠券折抵 (Discount):', discount);
      console.log('總計 (totalAmount):', totalAmount);
      console.log('------------------');


      // 建立訂單（💡 帶入自動查出的 resolvedSellerID 與優惠券資訊）
      const newOrder = await Order.create({
        SellerID: resolvedSellerID,
        BuyerName, BuyerPhone, BuyerEmail, BuyerAddress,
        TotalAmount: totalAmount,
        OrderStatus: ORDER_STATUS.PENDING_PAYMENT,
        PaymentStatus: 0,
        InvoiceType: InvoiceType || 'member', // (若沒傳預設 member)
        CarrierCode: CarrierCode || null,
        UTM_Source: UTM_Source || null,
        SessionID: SessionID || null,
        // 💡 確保優惠券欄位有確實對應（如果前端傳來的是小寫，這裡可以用 || 做相容）
        CouponID: CouponID || req.body.couponId || null,
        CouponCode: CouponCode || req.body.couponCode || null,
        DiscountValue: discount
      }, { transaction: t });

      // 建立物流
      await Shipment.create({
        OrderID: newOrder.OrderID,
        ShippingMethod,
        StoreInfo: StoreInfo || null,
        ShipmentStatus: 0
      }, { transaction: t });
      // ==========================================================
      // 💡 關鍵補上：建立付款記錄 (Payment)
      // ==========================================================
      await Payment.create({
        OrderID: newOrder.OrderID,
        PaymentMethod: PaymentMethod || 'CashOnDelivery', // 預設值或前端傳來的付款方式
        PaymentStatus: 0 // 0: 未付款 / 待付款
      }, { transaction: t });

      const finalDetails = details.map(d => ({ ...d, OrderID: newOrder.OrderID }));
      await Orderdetail.bulkCreate(finalDetails, { transaction: t });

      await t.commit();
      res.status(201).json({
        Success: true,
        OrderID: newOrder.OrderID,
        SubTotal: subTotal,
        ShippingFee: shippingFee,
        DiscountValue: discount,
        TotalAmount: totalAmount
      });
    } catch (error) {
      await t.rollback();
      res.status(400).json({ Success: false, Error: error.message });
    }
  },

 // ✨ 查詢單筆買家訂單詳情 (GET /:OrderID)
getOrderDetail: async (req, res) => {
  try {
    const { OrderID } = req.params;
    const inputPhone = req.query.phone ? req.query.phone.trim() : null;
    
    console.log('🔍 [查詢訂單] 收到請求 OrderID:', OrderID, '| 前端送來的電話:', inputPhone);

    // 1. 撈取訂單（補齊 Orderdetail 與 Product 的別名關聯）
    const order = await Order.findOne({
      where: { OrderID: OrderID },
      include: [
        {
          model: Orderdetail,
          as: 'Items', // 👈 Order 與 Orderdetail 的別名
          include: [
            { 
              model: Product,
              as: 'Product' // 👈 核心修正：補上 Product 的別名以解決報錯！
            }
          ]
        },
        { model: Shipment },
        { model: Payment }
      ]
    });

    // 如果訂單編號不存在
    if (!order) {
      console.log(`❌ 資料庫找不到 OrderID = ${OrderID} 的訂單`);
      return res.status(404).json({ Success: false, message: '找不到此訂單編號。' });
    }

    // 2. 手機號碼比對（自動處理 +886、空格與連字號）
    if (inputPhone) {
      const rawDbPhone = (order.BuyerPhone || '').trim();
      const cleanDb = rawDbPhone.replace(/\D/g, '');
      const cleanInput = inputPhone.replace(/\D/g, '');

      // 取得末 9 碼比對，容錯 +8869 與 09
      const last9Db = cleanDb.slice(-9);
      const last9Input = cleanInput.slice(-9);

      console.log(`📱 手機比對 -> 資料庫原始: [${rawDbPhone}] vs 輸入: [${inputPhone}]`);

      if (!last9Db || !last9Input || last9Db !== last9Input) {
        console.log('❌ 手機號碼比對失敗！');
        return res.status(404).json({ Success: false, message: '手機號碼與訂單不符合。' });
      }
    }

    console.log(`✅ 雙重驗證通過！成功回傳訂單 ${OrderID} 的資料！`);
    return res.json(order);

  } catch (error) {
    console.error('❌ 撈取資料庫噴出錯誤:', error);
    return res.status(500).json({ Success: false, Error: error.message });
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

      // 任務：關鍵例外處理 - 自動庫存回補並自動恢復上架 (狀態改為 9:已取消)
      if (Number(OrderStatus) === ORDER_STATUS.CANCELLED) {
        for (const item of order.Items) {
          const product = await Product.findByPk(item.ProductID, { transaction: t });
          if (product) {
            product.Stock += item.Quantity; // 加回庫存

            // 🚀 如果加回庫存後大於 0，就自動將商品恢復上架！
            if (product.Stock > 0) {
              product.IsActive = 1;
            }

            await product.save({ transaction: t });
          }
        }
      }
      //賣光自動下架：結帳買到庫存見底 ➔ Stock = 0, IsActive = 0（前台自動隱身）。
      //取消自動上架：買家取消訂單➔ 庫存加回來 ➔ Stock > 0, IsActive = 1（前台自動復活出現）。

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
