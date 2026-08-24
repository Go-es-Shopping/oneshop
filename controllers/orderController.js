// 💡 記得確定有把 StorePage 從 ../models 引入進來
const { Order, Orderdetail, Product, Shipment, Payment, StorePage, sequelize } = require('../models');
const { createAesEncrypt, createSha256Encrypt } = require('../utils/newebpay'); // 請依你的檔案實際路徑調整

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

      // ==========================================
      // 💡：在 Commit 交易之前，先把 storeSlug 查好！
      // ==========================================
      // 💡 嘗試查詢該賣場是否有設定專屬網址 (Slug)
      let storeSlug = null;
      if (PageID && StorePageModel) {
        const foundStore = await StorePageModel.findByPk(PageID, { transaction: t });
        if (foundStore && foundStore.PageUrl) {
          storeSlug = foundStore.PageUrl;
        }
      }

      // 交易正式提交
      await t.commit();

      // --- 🚀 依據付款方式進行分流處理 (強化字串比對容錯力) ---
      const rawPayment = PaymentMethod ? String(PaymentMethod).toLowerCase() : 'cod';
      
      let dbPaymentMethod = 'cod';
      if (rawPayment.includes('atm') || rawPayment.includes('轉帳')) {
        dbPaymentMethod = 'atm';
      } else if (
        rawPayment.includes('card') || 
        rawPayment.includes('credit') || 
        rawPayment.includes('信用卡') || 
        rawPayment.includes('creditcard')
      ) {
        dbPaymentMethod = 'CreditCard';
      }

      console.log(`💳 前端傳入 PaymentMethod: [${PaymentMethod}], 解析結果為: [${dbPaymentMethod}]`);

      // 1. 如果是貨到付款 (cod)
      if (dbPaymentMethod === 'cod') {
        return res.status(201).json({ 
          Success: true, 
          Type: 'normal',
          OrderID: newOrder.OrderID, 
          SubTotal: subTotal,
          ShippingFee: shippingFee,
          DiscountValue: discount,
          TotalAmount: totalAmount,
          Message: '下單成功'
        });
      }

      // 2. 如果是藍新金流支援的線上支付 (CreditCard 或 atm)
      const merchantID = process.env.MERCHANT_ID || 'MS12345678';
      // 優先讀取 FRONTEND_URL，如果沒有就讀取 NOTIFY_URL 的網域部分，再沒有就使用固定的 ngrok 網址
const baseUrl = process.env.FRONTEND_URL || process.env.NOTIFY_URL || 'https://niece-eel-casket.ngrok-free.dev';

    // 💡 智慧決定 ReturnURL：優先使用漂亮的專屬網址，若無則使用傳統的 pageId 路由
    const returnUrl = storeSlug 
        ? `${baseUrl}/store/${storeSlug}` 
        : `${baseUrl}/goez-store-template.html?pageId=${PageID || 1}`;

      const tradeInfoObj = {
        MerchantID: merchantID,
        RespondType: 'JSON',
        TimeStamp: Math.floor(Date.now() / 1000).toString(),
        Version: '2.0',
        LangType: 'zh-tw',
        MerchantOrderNo: `GOEZ_${newOrder.OrderID}_${Date.now()}`, // 確保訂單編號唯一
        Amt: Math.round(totalAmount),
        ItemDesc: `Goezshop 訂單 #${newOrder.OrderID}`,
        Email: BuyerEmail || 'test@example.com',
      
      // 背景通知網址（讓後端更新訂單狀態）
      NotifyURL: `${baseUrl}/api/payment/notify`,
      
      // 付款完成後，讓瀏覽器依據賣場設定自動跳回對應的專屬網址或範本頁
      ReturnURL: returnUrl,
    };

      if (dbPaymentMethod === 'atm') {
        tradeInfoObj.VACC = 1; // 啟用虛擬帳號
      } else if (dbPaymentMethod === 'CreditCard') {
        tradeInfoObj.CREDIT = 1; // 啟用信用卡一次付清
      }

      // 進行 AES 加密與 SHA256 驗證碼計算
      const encryptedTradeInfo = createAesEncrypt(tradeInfoObj);
      const hashValue = createSha256Encrypt(encryptedTradeInfo);

      // 回傳給前端，讓前端進行頁面跳轉
      return res.status(201).json({ 
        Success: true, 
        Type: 'redirect', 
        PaymentGatewayUrl: process.env.NEWEBPAY_GATEWAY_URL || 'https://core.newebpay.com/MPG/mpg_gateway',
        MerchantID: process.env.MERCHANT_ID,
        TradeInfo: encryptedTradeInfo,
        TradeSha: hashValue,
        Version: '2.0',
        OrderID: newOrder.OrderID,
        TotalAmount: totalAmount
      });

    } catch (error) {
      // 💡：加上防禦性判斷，避免對已完成的交易做 rollback
      if (t && !t.finished) {
        await t.rollback();
      }
      console.error('🔴 結帳失敗:', error);
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

  // ✨ 補上失蹤的：查詢單筆買家訂單詳情 (GET /:OrderID)
getOrderDetail: async (req, res) => {
  try {
    const { OrderID } = req.params; // 拿到網址上的 14
    
    console.log('🔍 [真資料庫模式] 正在撈取訂單詳情，編號為:', OrderID);

    // 去 SQL Server 尋找這筆訂單，並按照組長規格優化：include 物流和付款
    const order = await Order.findOne({
      where: { OrderID: OrderID },
      include: [Shipment, Payment] // 👈 任務：資料關聯優化（物流與付款狀態）
    });

    // 如果資料庫真的找不到這筆編號
    if (!order) {
      console.log(`❌ 資料庫找不到 OrderID = ${OrderID} 的訂單`);
      return res.status(404).json({ Success: false, message: '找不到此訂單，請確認訂單編號是否正確。' });
    }

    // 🎯 成功捞到資料，打包回傳給前端網頁！
    console.log(`✅ 成功撈到訂單 ${OrderID} 的真資料！`);
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
