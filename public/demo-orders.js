/**
 * 買家查詢訂單 — 示範資料與查詢邏輯（index.html / order-detail.html 共用）
 */
(function (global) {
  var STORAGE_KEY = 'goezBuyerOrderDetail';
  var LOOKUP_MONTHS = 6;
  var DEMO_ORDER_ID = 10032;
  var DEMO_ORDER_PHONE = '+886912345678';

  var demoOrders = [
    {
      OrderID: DEMO_ORDER_ID,
      BuyerName: '王小明',
      BuyerPhone: DEMO_ORDER_PHONE,
      BuyerEmail: 'demo@email.com',
      BuyerAddress: '新北市淡水區英專路151號',
      OrderStatus: 3,
      PaymentStatus: 1,
      TotalAmount: 3280,
      CreatedAt: '2026-05-22T15:20:00',
      items: [
        { ProductName: '北歐風馬克杯組（2入）', ProductImg: '', Quantity: 1, UnitPrice: 1280 },
        { ProductName: '天然乳木果護手霜 50ml', ProductImg: '', Quantity: 2, UnitPrice: 1000 },
      ],
      shipment: {
        ShippingMethod: '宅配',
        TrackingNumber: 'DEMO-TW-99999-20260523',
        ShipmentStatus: 3,
        ShippedAt: '2026-05-23T09:30:00',
      },
      payment: {
        PaymentMethod: '信用卡',
        PaymentStatus: '已完成',
        PaidAt: '2026-05-22T15:21:18',
      },
    },
    {
      OrderID: 10086,
      BuyerName: '王小明',
      BuyerPhone: '+886912345678',
      BuyerEmail: 'demo@email.com',
      BuyerAddress: '新北市淡水區英專路151號',
      OrderStatus: 1,
      PaymentStatus: 1,
      TotalAmount: 1580,
      CreatedAt: '2026-05-20T14:32:00',
      items: [
        { ProductName: '輕量運動水壺 600ml', ProductImg: '', Quantity: 1, UnitPrice: 580 },
        { ProductName: '環保購物袋（大）', ProductImg: '', Quantity: 2, UnitPrice: 120 },
      ],
      shipment: {
        ShippingMethod: '7-ELEVEN 交貨便',
        TrackingNumber: 'TW-20260520-889912',
        ShipmentStatus: 0,
        ShippedAt: null,
      },
      payment: { PaymentMethod: '信用卡', PaymentStatus: '已完成', PaidAt: '2026-05-20T14:33:10' },
    },
    {
      OrderID: 10041,
      BuyerName: '王小明',
      BuyerPhone: '+886912345678',
      BuyerEmail: 'demo@email.com',
      BuyerAddress: '新北市淡水區英專路151號',
      OrderStatus: 0,
      PaymentStatus: 0,
      TotalAmount: 890,
      CreatedAt: '2026-05-24T08:05:00',
      items: [{ ProductName: '棉質 T 恤（L）', ProductImg: '', Quantity: 1, UnitPrice: 890 }],
      shipment: {
        ShippingMethod: '7-ELEVEN 交貨便',
        TrackingNumber: '',
        ShipmentStatus: 0,
        ShippedAt: null,
      },
      payment: { PaymentMethod: '信用卡', PaymentStatus: '未付款', PaidAt: null },
    },
  ];

  function normalizePhone(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.indexOf('886') === 0) return '+' + digits;
    if (digits.charAt(0) === '0') return '+886' + digits.slice(1);
    return '+' + digits;
  }

  function isWithinLookupRange(createdAt) {
    var created = new Date(createdAt);
    if (isNaN(created.getTime())) return true;
    var limit = new Date();
    limit.setMonth(limit.getMonth() - LOOKUP_MONTHS);
    return created >= limit;
  }

  function lookupOrder(orderIdRaw, phoneRaw) {
    var orderId = parseInt(String(orderIdRaw).trim(), 10);
    if (!String(orderIdRaw).trim() || isNaN(orderId)) {
      return { error: '請輸入有效的訂單編號。' };
    }
    if (!String(phoneRaw).trim()) {
      return { error: '請輸入聯絡電話。' };
    }

    var order = demoOrders.find(function (o) { return o.OrderID === orderId; });
    if (!order) {
      return { error: '找不到此訂單，請確認訂單編號是否正確。' };
    }
    if (normalizePhone(phoneRaw) !== normalizePhone(order.BuyerPhone)) {
      return { error: '訂單編號與聯絡電話不符，請重新確認。' };
    }
    if (!isWithinLookupRange(order.CreatedAt)) {
      return { error: '此訂單超過可查詢區間（6 個月內），請聯絡店家協助。' };
    }
    return { order: order };
  }

  function saveOrderForDetail(order) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch (e) {
      /* ignore */
    }
  }

  function loadOrderFromDetail() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearOrderDetail() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function getDemoOrder() {
    return demoOrders.find(function (o) { return o.OrderID === DEMO_ORDER_ID; }) || null;
  }

  global.GoezBuyerOrders = {
    STORAGE_KEY: STORAGE_KEY,
    DEMO_ORDER_ID: DEMO_ORDER_ID,
    DEMO_ORDER_PHONE: DEMO_ORDER_PHONE,
    demoOrders: demoOrders,
    lookupOrder: lookupOrder,
    saveOrderForDetail: saveOrderForDetail,
    loadOrderFromDetail: loadOrderFromDetail,
    clearOrderDetail: clearOrderDetail,
    getDemoOrder: getDemoOrder,
  };
})(window);
