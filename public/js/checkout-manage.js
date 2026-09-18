/**
 * ====================================================================
 * Goezshop 結帳與優惠券驗證模組 (結帳處理組員可沿用更新 目前內容包含主題渲染與優惠券處理)
 * ====================================================================
 * 【核心職責】
 * 1. 抓取網址中的 pageId/storeId，動態套用對應賣場的主題色與字體。
 * 2. 自動從 localStorage 讀取購物車商品，動態渲染右側訂單摘要與運費計算。
 * 3. 監聽結帳頁面（goez-checkout.html）中「套用優惠券」按鈕事件。
 * 4. 進行前端防呆檢查，並透過 .toLowerCase() 支援使用者自然大小寫輸入。
 * 5. 串接後端 /api/coupons/apply 進行「代碼有效性、期限與低消門檻」驗證。
 * 6. 即時計算折抵金額，並動態更新畫面上顯示的折扣與最終結帳總金額 (UI)。
 * 7. 當使用者點擊「結帳」按鈕時，串接後端進行訂單建立（支援發票載具與付款方式 PaymentMethod、優惠券寫入）。
 * 
 * 【協作說明】
 * 本檔案負責前端結帳互動與優惠券非同步驗證，供未來組員進行結帳頁面串接與維護時沿用。
 * ====================================================================
 * 由 goez-checkout.html 引用
 */

// 💡 宣告全域變數記錄當前選擇的付款方式（預設為信用卡 card）
let selectedPaymentType = 'card';

// 💡 宣告全域變數暫存成功套用的優惠券資訊（供下單時帶入資料庫）
let appliedCouponData = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. 抓取網址中的 pageId（或 storeId）
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get('pageId') || '';

  if (pageId) {
    try {
      // 呼叫後端 API 取得該賣場的詳細設定（包含主題色、字體等）
      const response = await fetch(`/api/store/template/${pageId}`);
      const result = await response.json();
      const data = result.success && result.data ? result.data : result;

      // ==========================================
      // 🎨 動態套用賣場主題色與字體
      // ==========================================
      const themeColorName = data.ThemeColor || data.themeColor;
      const accentColor = data.accentColor || data.AccentColor;
      const themeFont = data.ThemeFont || data.themeFont;

      const themes = {
        '冷靜石板': { '--c-accent': '#64748b', '--c-accent-dark': '#475569', '--c-theme-1': '#64748b', '--c-theme-2': '#94a3b8', '--c-theme-3': '#cbd5e1', '--c-theme-4': '#f1f5f9' },
        '鼠尾草綠': { '--c-accent': '#869489', '--c-accent-dark': '#657367', '--c-theme-1': '#869489', '--c-theme-2': '#a3ad9e', '--c-theme-3': '#c2c9bd', '--c-theme-4': '#e8ebe4' },
        '陶土橘': { '--c-accent': '#b38b7d', '--c-accent-dark': '#8c685b', '--c-theme-1': '#b38b7d', '--c-theme-2': '#d1b4a6', '--c-theme-3': '#e5d3c8', '--c-theme-4': '#f5efea' },
        '北歐沙色': { '--c-accent': '#a8a29e', '--c-accent-dark': '#78716c', '--c-theme-1': '#a8a29e', '--c-theme-2': '#d6d3d1', '--c-theme-3': '#e7e5e4', '--c-theme-4': '#f5f5f4' }
      };

      let applied = false;
      if (themeColorName && themes[themeColorName]) {
        const selectedTheme = themes[themeColorName];
        for (const [varName, colorValue] of Object.entries(selectedTheme)) {
          document.documentElement.style.setProperty(varName, colorValue);
        }
        applied = true;
      }

      if (!applied && accentColor) {
        document.documentElement.style.setProperty('--c-accent', accentColor);
      }

      // 字體套用
      const fontFamilies = {
        'gothic': "'Noto Sans TC', sans-serif",
        'serif': "'Noto Serif TC', serif",
        'round': "'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"
      };

      if (themeFont && fontFamilies[themeFont]) {
        const fontValue = fontFamilies[themeFont];
        const styleId = 'dynamic-font-override';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = `body, *, button, input, select, textarea, h1, h2, h3, h4, h5, h6 { font-family: ${fontValue} !important; }`;
      }

      // 如果頁面上有顯示店舖名稱的標題，順便帶入
      const storeTitleEl = document.querySelector('.store-title, #storeTitle');
      if (storeTitleEl && data.storeName) {
        storeTitleEl.textContent = data.storeName;
      }

    } catch (err) {
      console.error('載入賣場主題樣式失敗:', err);
    }
  }

  // 2. 初始化載入右側訂單摘要商品
  loadCheckoutSummary();
});

/**
 * 從 localStorage 讀取商品並動態渲染到右側訂單摘要（完全對應你的 CSS Class）
 */
function loadCheckoutSummary() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get('pageId') || '';

  // 💡 關鍵修正：優先讀取該賣場獨立的結帳資料，避免不同賣場互相覆蓋混淆
  const rawData = localStorage.getItem(`goez_checkout_cart_${pageId}`) || localStorage.getItem(`goez_cart_${pageId}`) || localStorage.getItem('goez_cart_v2') || localStorage.getItem('cartItems') || localStorage.getItem('cart');
  
  const orderItemsContainer = document.getElementById('orderItems');
  const orderTotalsContainer = document.getElementById('orderTotals');

  if (!rawData || !orderItemsContainer) return;

  try {
    const items = JSON.parse(rawData);
    if (!items || items.length === 0) return;

    let subtotal = 0;
    let itemsHtml = '';

    items.forEach(item => {
      const price = item.price || 0;
      const quantity = item.qty || item.quantity || 1;
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      itemsHtml += `
        <div class="order-item">
          <div class="order-item__img">
            <img src="${item.imageUrl || item.image || item.img || 'public/images/default.jpg'}" alt="${item.name}">
          </div>
          <div class="order-item__info">
            <div class="order-item__name">${item.name}</div>
            <div class="order-item__qty">x${quantity}</div>
          </div>
          <div class="order-item__price">$${itemTotal.toLocaleString()}</div>
        </div>
      `;
    });

    orderItemsContainer.innerHTML = itemsHtml;

    const shippingFee = subtotal >= 1000 ? 0 : 60;
    const finalTotal = subtotal + shippingFee;

    if (orderTotalsContainer) {
  const freeTag = ` <span style="color:var(--c-success); font-size:12px;" data-i18n="freeShippingTag">${t('freeShippingTag', '（滿千免運）')}</span>`;
  const shippingValHtml = shippingFee === 0 
    ? `<span data-i18n="freeLabel">${t('freeLabel', '免費')}</span>` 
    : '$' + shippingFee;

  orderTotalsContainer.innerHTML = `
    <div class="order-total-row">
      <span class="order-total-row__label" data-i18n="labelSubtotal">${t('labelSubtotal', '小計')}</span>
      <span class="order-total-row__val">$${subtotal.toLocaleString()}</span>
    </div>
    <div class="order-total-row">
      <span class="order-total-row__label">
        <span data-i18n="labelHomeShipping">${t('labelHomeShipping', '運費')}</span> 
        ${subtotal >= 1000 ? freeTag : ''}
      </span>
      <span class="order-total-row__val ${shippingFee === 0 ? 'free' : ''}">
        ${shippingValHtml}
      </span>
    </div>
    <div class="order-divider"></div>
    <div class="order-total-row order-total-row--grand" style="margin-top:8px;">
      <span class="order-total-row__label" data-i18n="labelGrandTotal">${t('labelGrandTotal', '合計')}</span>
      <span class="order-total-row__val" id="totalVal" data-raw-total="${finalTotal}">$${finalTotal.toLocaleString()}</span>
    </div>
  `;

  // 🌟 關鍵補強：插入 DOM 後立即重新掃描一次多語言
  if (window.GoezI18n && typeof GoezI18n.apply === 'function') {
    GoezI18n.apply();
  }
}

    // 💡 關鍵保險：只要順利執行到這裡（代表有讀到商品），就強制解鎖下單按鈕！
    const confirmBtn = document.getElementById('confirmBtn');
    const mobileConfirmBtn = document.getElementById('mobileConfirmBtn');
    if (confirmBtn) confirmBtn.disabled = false;
    if (mobileConfirmBtn) mobileConfirmBtn.disabled = false;
  } catch (err) {
    console.error('解析結帳商品資料失敗:', err);
  }
}

/**
 * 點擊套用優惠券
 * 💡 支援自然大小寫輸入，送出前自動轉小寫比對資料庫
 */
async function applyCoupon() {
  const couponInput = document.getElementById('couponInput');
  const couponMsg = document.getElementById('couponMsg');
  
  const couponCode = couponInput ? couponInput.value.trim().toLowerCase() : '';
  
  const totalValElement = document.getElementById('totalVal');
  
  // 💡 修正 1：安全取得或鎖定未折抵的原始總額 (Base Total)，避免重複點擊時被連減
  let baseTotal = totalValElement ? parseInt(totalValElement.getAttribute('data-base-total')) : NaN;
  if (!baseTotal || isNaN(baseTotal)) {
    const currentRaw = totalValElement ? parseInt(totalValElement.getAttribute('data-raw-total')) || 2000 : 2000;
    if (totalValElement) {
      totalValElement.setAttribute('data-base-total', currentRaw);
    }
    baseTotal = currentRaw;
  }

  if (!couponCode) {
    if (couponMsg) {
      couponMsg.textContent = '請輸入優惠碼';
      couponMsg.className = 'coupon-msg err';
    }
    return;
  }

  try {
    const response = await fetch('/api/coupons/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, orderTotal: baseTotal }) // 帶入原價給後端驗證低消
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // 💡 正確抓取後端回傳的折抵金額
      const discountAmount = result.data ? result.data.discountValue : 0;
      
      // 💡 修正 2：永遠用固定的 baseTotal (原價) 去減折扣，重複按幾次都安全
      const finalTotal = Math.max(0, baseTotal - discountAmount);

      // 💡 紀錄成功套用的優惠券資訊（供下單時寫入資料庫）
      appliedCouponData = {
        CouponID: result.data ? (result.data.couponId || result.data.CouponID || null) : null,
        CouponCode: couponCode,
        DiscountValue: discountAmount
      };

      if (couponMsg) {
  const codeStr = appliedCouponData ? appliedCouponData.code : '';
  const labelStr = appliedCouponData ? (appliedCouponData.label || '') : '';
  const msgTpl = (window.GoezI18n && typeof GoezI18n.t === 'function') 
    ? GoezI18n.t('couponAppliedMsg', '✓ 優惠碼「{code}」已套用 — {label}，折抵 -${val}')
    : '✓ 優惠碼已套用 — {label}，折抵 -${val}';
  
  const text = msgTpl
    .replace('{code}', codeStr)
    .replace('{label}', labelStr)
    .replace('{val}', discountAmount.toLocaleString());
  
  couponMsg.textContent = text;
  couponMsg.className = 'coupon-msg ok';
}
updateFinalTotalAfterDiscount(finalTotal);
} else {
// 驗證失敗則清空暫存
appliedCouponData = null;
if (couponMsg) {
  const isThreshold = result.message && (result.message.includes('門檻') || result.message.includes('Threshold') || result.message.includes('利用金額'));
  let errKey = isThreshold ? 'couponErrThreshold' : 'couponErrInvalid';
  let defaultFallback = isThreshold ? '無法使用此優惠券：未達使用門檻' : (result.message || '優惠碼無效或已過期');
  
  const errText = (window.GoezI18n && typeof GoezI18n.t === 'function')
    ? GoezI18n.t(errKey, defaultFallback)
    : `無法使用此優惠券：${result.message || '代碼無效或未達門檻'}`;
    
  couponMsg.textContent = errText;
  couponMsg.className = 'coupon-msg err';
}
}
} catch (error) {
console.error('套用優惠券發生錯誤:', error);
appliedCouponData = null;
if (couponMsg) {
  couponMsg.textContent = (window.GoezI18n && GoezI18n.currentLang === 'en') ? 'System busy, please try later' : ((window.GoezI18n && GoezI18n.currentLang === 'ja') ? 'システム混雑中、しばらくしてからお試しください' : '系統忙碌中，請稍後再試');
  couponMsg.className = 'coupon-msg err';
}
}
}
/**
 * 更新折扣後的最終金額
 */
function updateFinalTotalAfterDiscount(finalTotal) {
  const totalValElement = document.getElementById('totalVal');
  if (totalValElement) {
    totalValElement.textContent = `$${finalTotal.toLocaleString()}`;
    totalValElement.setAttribute('data-raw-total', finalTotal);
  }
}

/**
 * 建立訂單按鈕點擊事件（串接後端 /api/orders）
 */
async function submitOrder() {
  // 1. 抓取聯絡資訊欄位的值
  const buyerName = document.getElementById('fName').value.trim();
  const buyerPhone = document.getElementById('fPhone').value.trim();
  const buyerEmail = document.getElementById('fEmail').value.trim();

  // 2. 前端必填驗證（聯絡資訊）
  if (!buyerName || !buyerPhone || !buyerEmail) {
    alert('請完整填寫聯絡資訊（姓名、手機號碼、電子郵件）！');
    return;
  }

  // 2.5. 抓取發票與載具欄位的值並進行防呆驗證
  const invoiceType = document.getElementById('invoiceType')?.value || 'member';
  let carrierCode = null;

  if (invoiceType === 'barcode') {
    carrierCode = document.getElementById('carrierCode')?.value.trim() || '';
    if (!carrierCode || !carrierCode.startsWith('/') || carrierCode.length !== 8) {
      alert('請輸入正確的手機條碼格式（需以 / 開頭，共 8 碼，例如 /ABC1234）！');
      return;
    }
  }

  // 3. 判斷目前是宅配還是超商，並動態組合地址與物流方式
  const isHomeTab = document.getElementById('tab-home').classList.contains('active');
  const shippingMethod = isHomeTab ? '宅配' : '7-11';
  
  let buyerAddress = '';
  let storeInfo = null;

  if (isHomeTab) {
    const city = document.getElementById('fCity').value;
    const district = document.getElementById('fDistrict').value.trim();
    const address = document.getElementById('fAddress').value.trim();
    
    // 檢查縣市、鄉鎮市區、詳細地址是否都有填
    if (!city || !district || !address) {
      alert('請填寫完整的宅配地址（包含縣市、鄉鎮市區與詳細地址）！');
      return;
    }
    buyerAddress = `${city}${district}${address}`;
  } else {
    const storeName = document.getElementById('storeNameDisplay').textContent;
    if (storeName === '尚未選擇取件門市') {
      alert('請先選擇 7-ELEVEN 取件門市！');
      return;
    }
    buyerAddress = `[超商取件] ${storeName}`;
    storeInfo = storeName;
  }

  // 4. 從 localStorage 讀取當前賣場的商品，轉換成後端要的 items 格式
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get('pageId') || '';
  const rawData = localStorage.getItem(`goez_checkout_cart_${pageId}`) || localStorage.getItem(`goez_cart_${pageId}`) || localStorage.getItem('goez_cart_v2') || localStorage.getItem('cartItems') || localStorage.getItem('cart');
  
  let cartItems = [];
  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      cartItems = parsed.map(item => ({
        ProductID: item.id || item.productId || item.ProductID,
        Quantity: item.qty || item.quantity || 1
      }));
    } catch (e) {
      console.error('解析購物車商品失敗', e);
    }
  }

  if (cartItems.length === 0) {
    alert('您的購物車是空的，無法結帳！');
    return;
  }

  // 5. 準備組裝後端需要的完整 payload（包含付款方式、發票、以及優惠券欄位）
  const orderPayload = {
    PageID: pageId ? Number(pageId) : null, // 這裡一定要有，對應後端的 req.body.PageID// 傳遞當前是哪一個賣場頁面的 ID
    BuyerName: buyerName,
    BuyerPhone: buyerPhone,
    BuyerEmail: buyerEmail,
    BuyerAddress: buyerAddress,
    ShippingMethod: shippingMethod,    // 帶入正確的物流方式
    StoreInfo: storeInfo,              // 帶入超商資訊（若有）
    InvoiceType: invoiceType,          // 帶入發票載具類型
    CarrierCode: carrierCode,          // 帶入手機條碼
    PaymentMethod: selectedPaymentType,// 帶入目前選擇的付款方式 ('card', 'atm', 'cod')
    
    // 💡 帶入優惠券相關欄位（若有套用則代入，否則給 null / 0）
    CouponID: appliedCouponData ? appliedCouponData.CouponID : null,
    CouponCode: appliedCouponData ? appliedCouponData.CouponCode : null,
    DiscountValue: appliedCouponData ? appliedCouponData.DiscountValue : 0,

    items: cartItems
  };

  try {
    // 6. 切換按鈕為載入中狀態
    if (typeof setConfirmLoading === 'function') {
      setConfirmLoading(true);
    }

    // 7. 發送 POST 請求到後端 API 寫入資料庫
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const result = await response.json();

    if (response.ok && result.Success) {
      // 清空該賣場的購物車紀錄
      localStorage.removeItem(`goez_checkout_cart_${pageId}`);
      localStorage.removeItem(`goez_cart_${pageId}`);

      // 🚀 核心分流邏輯：依據後端回傳的 Type 決定下一步
      if (result.Type === 'redirect') {
        // 如果是藍新金流（信用卡 / ATM），動態建立隱藏表單並送出跳轉
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.PaymentGatewayUrl;

        const params = {
          MerchantID: result.MerchantID,
          TradeInfo: result.TradeInfo,
          TradeSha: result.TradeSha,
          Version: result.Version
        };

        for (const key in params) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = params[key];
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit(); // 自動發送表單前往藍新付款頁面！
      } else {
        // 如果是貨到付款 (cod) 或一般下單，直接導向原本的完成頁面
        alert(`下單成功！請記住!!您的訂單編號為：${result.OrderID}`);
        window.location.href = `/goez-store-template.html?pageId=${pageId || 1}`;
      }
    } else {
      alert('下單失敗：' + (result.Error || result.message || '發生未知錯誤'));
    }
  } catch (error) {
    console.error('送出訂單發生錯誤:', error);
    alert('網路連線異常或伺服器錯誤，請稍後再試。');
  } finally {
    // 8. 恢復按鈕狀態
    if (typeof setConfirmLoading === 'function') {
      setConfirmLoading(false);
    }
  }
}

/**
 * 切換收件方式（宅配 / 超商）
 */
function selectShippingType(type) {
  const tabHome = document.getElementById('tab-home');
  const tabCvs = document.getElementById('tab-cvs');
  const sectionHome = document.getElementById('shipping-home-section');
  const sectionCvs = document.getElementById('shipping-cvs-section');

  if (type === 'home') {
    tabHome.classList.add('active');
    tabCvs.classList.remove('active');
    sectionHome.style.display = 'block';
    sectionCvs.style.display = 'none';
  } else {
    tabCvs.classList.add('active');
    tabHome.classList.remove('active');
    sectionCvs.style.display = 'block';
    sectionHome.style.display = 'none';
  }
}

/**
 * 💡 切換付款方式（信用卡 / ATM / 貨到付款）並更新畫面選取狀態
 */
function selectPayment(type) {
  selectedPaymentType = type; // 更新全域變數 ('card', 'atm', 'cod')

  // 移除所有付款選項的 selected 樣式
  const payCard = document.getElementById('pay-card');
  const payAtm = document.getElementById('pay-atm');
  const payCod = document.getElementById('pay-cod');

  if (payCard) payCard.classList.remove('selected');
  if (payAtm) payAtm.classList.remove('selected');
  if (payCod) payCod.classList.remove('selected');

  // 為當前點擊的選項加上 selected 樣式
  const target = document.getElementById(`pay-${type}`);
  if (target) {
    target.classList.add('selected');
  }
}

// 模擬開啟超商地圖視窗
function openStoreModal() {
  const storeName = prompt('請輸入選擇的 7-ELEVEN 門市名稱：', '統一超商 華山門市');
  if (storeName) {
    document.getElementById('storeNameDisplay').textContent = storeName;
    document.getElementById('storeAddressInfo').textContent = '台北市中正區測驗街1號';
  }
}