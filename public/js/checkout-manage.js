/**
 * ====================================================================
 * Goezshop 結帳與優惠券驗證模組(結帳處理組員可沿用更新 目前內容僅放上優惠券處理)
 * ====================================================================
 * 【核心職責】(待更新)
 * 1. 監聽結帳頁面（goez-checkout.html）中「套用優惠券」按鈕事件。
 * 2. 進行前端防呆檢查，確保使用者有輸入優惠碼。
 * 3. 串接後端 /api/coupons/apply 進行「代碼有效性、期限與低消門檻」驗證。
 * 4. 即時計算折抵金額，並動態更新畫面上顯示的折扣與最終結帳總金額 (UI)。
 * 5. 當使用者點擊「結帳」按鈕時，串接後端 /api/checkout 進行訂單建立。
 * 
 * 【協作說明】
 * 本檔案負責前端結帳互動與優惠券非同步驗證，供未來組員進行結帳頁面串接與維護時沿用。
 * ====================================================================
 * 由 goez-checkout.html 引用
 */
//目前以下僅是結帳頁面中優惠卷區塊
// 假設結帳頁有一個「套用優惠券」按鈕和一個輸入框
document.getElementById('apply-coupon-btn').addEventListener('click', async () => {
  const couponCode = document.getElementById('coupon-input').value.trim();
  const subtotal = calculateCurrentCartTotal(); // 取得你目前購物車的總金額
  
  if (!couponCode) {
    alert('請輸入優惠碼');
    return;
  }

  try {
    // 呼叫我們剛剛對應好的驗證 API
    const response = await fetch('/api/coupons/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: couponCode,
        totalAmount: subtotal // 把當前購物車總金額傳過去檢查低消
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(`優惠券套用成功！折抵金額：$${result.discountAmount}`);
      
      // 更新畫面上顯示的折扣金額、最終總金額
      updateCheckoutUI(result.discountAmount, result.finalTotal);
    } else {
      alert(`無法使用此優惠券：${result.message}`);
    }
  } catch (error) {
    console.error('套用優惠券發生錯誤:', error);
    alert('系統忙碌中，請稍後再試');
  }
});