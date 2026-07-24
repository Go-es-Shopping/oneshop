/**
 * ====================================================================
 * Goezshop 商品管理與非同步上傳模組
 * ====================================================================
 * 【核心職責】
 * 1. 接管新增商品彈窗（Modal）的「確認新增」事件。
 * 2. 實作「非同步獨立上傳圖片」策略，防止 Base64 撐爆資料庫。
 * 3. 串接後端 /api/products 進行「商品、多語系內容、賣場關聯」三表連動寫入。
 * 
 * * 【核心修正】
 * 將原本的 Form 'submit' 監聽，升級為獨立 Button 'click' 監聽。
 * 徹底解除外層網頁 HTML5 原生表單（如 required）造成的攔截干擾！
 * ====================================================================
 * 由goez-store.html引用
 */

(function () {
  // 1. 抓取網址列的 PageID (上市平台必須知道這個商品屬於哪家店)
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get('pageId');

  // 2. 綁定前端 DOM 元素
  const imgInput = document.getElementById('modal-product-img');
  const confirmBtn = document.getElementById('modal-confirm-btn'); // 核心主角
  const toast = document.getElementById('modal-toast');

  // 全域變數：用來暫存後端吐回來的「真實圖片相對路徑」
  let uploadedProductImgUrl = "";
  let isSubmitting = false; // 防重噴鎖（Debounce Lock）

  if (!confirmBtn) {
    console.error("[System] 找不到 id='modal-confirm-btn' 的確認按鈕，停止綁定。");
    return;
  }

  // ─────────────────────────────────────────────────────────────────
  // 【核心功能一：獨立接管確認按鈕的 Click 事件】
  // ─────────────────────────────────────────────────────────────────
  confirmBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // 阻擋任何預設的表單送出行為

    if (isSubmitting) return alert("商品正在上傳中，請勿重複點擊！");
    if (!pageId) return alert("❌ 網址列缺少 pageId，無法綁定賣場！");

    // 2. 抓取文字欄位數值 (根據你彈窗內真實的 Input ID，如果不同請自行對齊)
    const productNameEl = document.getElementById('modal-product-name');
    const productDescEl = document.getElementById('modal-product-desc');
    const priceEl = document.getElementById('modal-product-price');
    const stockEl = document.getElementById('modal-product-stock');

    const productName = productNameEl ? productNameEl.value.trim() : "";
    const productDesc = productDescEl ? productDescEl.value.trim() : "";
    const price = priceEl ? priceEl.value : "0";
    const stock = stockEl ? stockEl.value : "0";

    // 自訂前端基本檢查
    if (!productName) {
      alert("⚠️ 商品名稱為必填欄位！");
      if (productNameEl) productNameEl.focus();
      return;
    }

    // 3. 打包 JSON 封包 (完全對齊後端 createProduct 欄位)
    const payload = {
      PageID: Number(pageId),          // 三表連動：關聯 dbo.PageProduct & PageContent
      ProductName: productName,        // 三表連動：寫入 dbo.PageContent
      ProductDescription: productDesc, // 三表連動：寫入 dbo.PageContent
      Price: price ? Number(price) : 0,// 三表連動：寫入 dbo.Product 主表
      Stock: stock ? Number(stock) : 0,// 三表連動：寫入 dbo.Product 主表
      ProductImg: uploadedProductImgUrl // 上市標準：這裡送的是後端生成的相對網址！
    };

    try {
      isSubmitting = true; // 上鎖
      confirmBtn.innerText = "寫入資料庫中...";
      confirmBtn.style.opacity = "0.6";

      console.log("[System] 準備發送商品資料到後端, Payload:", payload);

      // 4. 發送非同步請求到後端全新的三表連動大腦 (相容 Mock 模式)
      const response = await fetch(`/api/products?lang=zh-TW`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log("[System] 後端傳回結果:", result);

      // 在 Mock 模式下，只要有回傳物件，通常不論 success 是 true/false 都可以放行
      // 這裡做一個寬鬆相容：如果是在 Mock 模式下，就算 success 沒傳，有資料也算成功
      if (result.success || (result.ProductID || result.ProductName)) {
        
        // 5. 成功防禦：提示使用者，並重置、關閉彈窗
        showToast(`✅ 商品「${productName}」成功寫入！`);
        
        // 整合 Mock 模式或真實模式的資料結構
        const finalData = result.data || result;

        // 💡 【Backend Lead 終極修復】：立刻將新商品安全推入前端全域記憶體陣列！
        if (typeof window.currentStoreData !== 'undefined') {
            if (!window.currentStoreData.products) {
                window.currentStoreData.products = [];
            }
            window.currentStoreData.products.push(finalData);
            console.log("📦 [Memory Sync] 新商品已成功同步至 window.currentStoreData.products 陣列！現有商品數：", window.currentStoreData.products.length);
        }

        // 觸發自訂事件，通知右側編輯器重繪畫面（相容你們原本的渲染架構）
        document.dispatchEvent(new CustomEvent('product:add', { detail: finalData }));

        // 呼叫原本 store.html 裡的關閉與重置函式
        if (typeof resetModal === 'function') resetModal();
        if (typeof closeModal === 'function') closeModal();
        
        uploadedProductImgUrl = ""; // 清空上傳圖片暫存
      } else {
        alert("❌ 新增商品失敗：" + (result.message || result.error));
      }

    } catch (err) {
      console.error("後端三表連動寫入出錯:", err);
      alert("⚠️ 伺服器連線失敗，請檢查 Node.js 控制台 Log。");
    } finally {
      isSubmitting = false; // 解鎖
      confirmBtn.innerText = "確認新增";
      confirmBtn.style.opacity = "1";
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // 【核心功能二：圖片改變時，立刻背景非同步上傳】
  // ─────────────────────────────────────────────────────────────────
  if (imgInput) {
    imgInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 上市防禦：檢查檔案大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ 圖片大小不能超過 5MB！");
        return;
      } 

      // 建立 FormData 封包
      const formData = new FormData();
      formData.append('product_file', file);

      console.log("[System] 偵測到商品圖片選取，啟動非同步背景上傳...");

      try {
        const res = await fetch('/api/upload-product-img', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          uploadedProductImgUrl = data.url; 
          console.log("🔥 背景圖片上傳大成功！後端真實圖片網址暫存為:", uploadedProductImgUrl);
        } else {
          console.error("圖片背景上傳失敗:", data.message);
          showToast("⚠️ 圖片伺服器拒絕接收，將使用預設占位圖");
        }
      } catch (err) {
        console.error("圖片非同步上傳失敗:", err);
        showToast("⚠️ 圖片上傳失敗，請檢查硬碟寫入權限");
      }
    });
  }

  // 輔助 Toast 提示函式
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3000);
  }

  // ─────────────────────────────────────────────────────────────────
  // 【強制救援：收到新增商品訊號，強制在中間預覽區動態追加卡片】
  // 自動換行、多商品追加、徹底除靈
  // ─────────────────────────────────────────────────────────────────
  document.addEventListener('product:add', (e) => {
    console.log("📡 [Backend Lead 終極除錯] 偵測到新商品，準備進行完美渲染！", e.detail);
    const prod = e.detail;

    // 1. 定位中間紅圈的核心容器
    const targetContainer = document.getElementById('product-list');

    if (targetContainer) {
      
      // 💡 關鍵排版防禦：強制讓前端夥伴的容器具備「換行」能力，這樣滿了就會自動往下排，不用滑右邊！
      targetContainer.style.display = "flex";
      targetContainer.style.flexWrap = "wrap";
      targetContainer.style.gap = "20px";
      targetContainer.style.justifyContent = "flex-start";

      // 2. 處理價格小數點防禦：避免出現 1500.00.00
      let displayPrice = prod.Price;
      if (typeof displayPrice === 'number' || (typeof displayPrice === 'string' && !displayPrice.includes('.'))) {
         displayPrice = `${displayPrice}.00`;
      } else if (typeof displayPrice === 'string' && displayPrice.includes('.')) {
         // 如果本來就是 1500.00，就直接維持原樣
         displayPrice = parseFloat(displayPrice).toFixed(2);
      }

      // 3. 建立符合排版系統、且完全對齊前端字體/顏色清單的原生商品卡片 HTML
// 右下角加入購物車圓鈕
// 🔍 [Backend Lead 驅魔插樁] 看前端到底收到了什麼！
console.log("=== 📦 前端收到單個商品物件 ===", JSON.stringify(prod, null, 2));

// 🔥 【修復重點】向全域的 themes 索取目前被點選的主題顏色
const currentThemeName = document.querySelector('.theme-option.selected .theme-option__name')?.textContent.trim() || '冷靜石板';
const activeColor = (typeof themes !== 'undefined' && themes[currentThemeName]) 
                    ? themes[currentThemeName]['--c-theme-1'] 
                    : '#6a8abaff';

const cardHtml = `
    <div class="product-card" data-id="${prod.ProductID}" style="background: var(--c-white, #fff); border: 1px solid var(--c-border-light, #eaeaea); border-radius: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); overflow: hidden; display: flex !important; flex-direction: column !important; align-items: stretch !important; cursor: pointer; transition: transform 0.25s ease, box-shadow 0.25s ease; box-sizing: border-box; width: calc(33.333% - 14px); min-width: 200px; position: relative; font-family: var(--f-body, sans-serif) !important;">
      
      <!-- 商品圖片區 -->
      <div style="height: 180px; flex-shrink: 0; overflow: hidden; position: relative; background: #f5f5f5;">
        <img src="${prod.ProductImg || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300'}" 
             alt="${prod.ProductName}" 
             style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      
      <!-- 商品文字與資訊主體 -->
      <div style="padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 8px;">
        
        <!-- 名稱與剩餘數量行 (右上角顯示剩餘，不與按鈕打架) -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <h4 style="margin: 0; font-family: 'Noto Sans TC', sans-serif; font-weight: 700; font-size: 16px; color: #333; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${prod.ProductName}</h4>
          <span style="font-family: 'Noto Sans TC', sans-serif; font-weight: 400; font-size: 12px; color: #888; white-space: nowrap; margin-top: 2px;">剩餘 ${prod.Stock}</span>
        </div>
        
        <!-- 額外保留的商品描述欄位 -->
        <p style="color: #888; font-size: 12px; margin: 0; font-family: 'Noto Sans TC', sans-serif; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px;">
          ${prod.ProductDescription || '暫無商品描述'}
        </p>
        
        <!-- 價格與購物車按鈕同一行 (右下角獨立按鈕) -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">  
        <span style="font-family: 'Noto Sans TC', sans-serif; font-weight: 900; font-size: 18px; color: ${activeColor}; line-height: 1;">$${displayPrice}</span>
          
          <!-- 👇 【新增】刪除按鈕，點擊時帶有該商品的 ProductID -->
            <button class="delete-product-btn" data-id="${prod.ProductID}" style="background: #ff4d4f; color: white; border: none; padding: 4px 8px; border-radius: 8px; cursor: pointer; font-size: 12px;">刪除</button>

          <!-- 購物車按鈕 -->
          <button class="add-to-cart-btn" style="position: absolute; right: 16px; bottom: 16px; background: var(--c-theme-1, #2b4c7e); border-radius: 14px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.12); flex-shrink: 0; transition: transform 0.15s ease;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
      </div>

    </div>
`;

      // 4. 【高智商驅魔追加機制】
      // 如果目前容器裡面「只有」目前尚無商品，或者是前端剛載入時亂噴出來的唯一一張垃圾 undefined 卡片
      // 我們在新增「第一件」真正商品時，要把這些髒東西一次性大掃除！
      if (targetContainer.innerHTML.includes("目前尚無商品") || 
          (targetContainer.innerHTML.includes("undefined") && targetContainer.querySelectorAll('.product-card').length <= 1)) {
        
        targetContainer.innerHTML = cardHtml; // 全面淨化，放上第一張完美的商品
        console.log("🎯 [Backend Lead] 第一件商品降落，成功強力驅逐垃圾卡片與提示字！");
      
      } else {
        
        // 如果原本已經有我們剛才畫好的正確商品卡片了，就「絕對不要用 innerHTML 覆蓋」，而是用 insertAdjacentHTML 往後疊加！
        // 同時，為了防範前端的 store-render.js 同步吐出來的 undefined 卡片，我們在追加前順便把畫面上的 undefined 元素給除掉
        const badCards = targetContainer.querySelectorAll('.product-card');
        badCards.forEach(card => {
          if (card.innerHTML.includes('undefined')) {
            card.remove(); // 抓到前端亂噴的鬼魂卡片，直接精準銷毀
          }
        });

        // 疊加新商品
        targetContainer.insertAdjacentHTML('beforeend', cardHtml);
        console.log("🎯 [Backend Lead] 成功在隊尾追加第二件新商品，並維持換行排列！");
        
        // 🔥 【優化】新商品卡片加入後，立即同步當前選擇的字體！
        // 讓新卡片的所有文字元素（p, span, h4 等）都正確繼承字體
        const allNewCards = targetContainer.querySelectorAll('.product-card');
        const lastNewCard = allNewCards[allNewCards.length - 1];
        if (lastNewCard) {
          // 讀取當前全域字體變數
          const currentFont = getComputedStyle(document.documentElement).getPropertyValue('--f-body') || 
                             '"Noto Sans TC", "Arial", "Microsoft JhengHei", sans-serif';
          
          // 套用至新卡片內的所有文字元素
          const allTextElements = lastNewCard.querySelectorAll('p, span, h4, div, li');
          allTextElements.forEach(el => {
            el.style.fontFamily = currentFont;
          });
          lastNewCard.style.fontFamily = currentFont;
        }
      }
    }
  });
  // ─────────────────────────────────────────────────────────────────
  // 【核心功能三：全域攔截商品刪除按鈕事件】
  // ─────────────────────────────────────────────────────────────────
  document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-product-btn')) {
          const productId = e.target.getAttribute('data-id');
          
          if (!confirm("確定要刪除這個商品嗎？")) return;

          try {
              // 發送 DELETE 請求給後端 API
              const response = await fetch(`/api/products/${productId}`, {
                  method: 'DELETE'
              });

              if (response.ok || response.status === 204) {
                  showToast("✅ 商品刪除成功！");

                  // 1. 從前端全域記憶體陣列中同步濾除該商品
                  if (window.currentStoreData && window.currentStoreData.products) {
                      window.currentStoreData.products = window.currentStoreData.products.filter(
                          p => Number(p.ProductID) !== Number(productId)
                      );
                  }

                  // 2. 直接從畫面上移除該張卡片
                  const card = e.target.closest('.product-card');
                  if (card) card.remove();

                  // 3. 如果全部刪光了，補上「目前尚無商品」提示
                  const targetContainer = document.getElementById('product-list');
                  if (targetContainer && targetContainer.querySelectorAll('.product-card').length === 0) {
                      targetContainer.innerHTML = `<div style="color: #888; text-align: center; width: 100%; padding: 40px;">目前尚無商品</div>`;
                  }
              } else {
                  const errData = await response.json().catch(() => ({}));
                  alert("❌ 刪除失敗：" + (errData.error || "伺服器錯誤"));
              }
          } catch (err) {
              console.error("刪除請求失敗:", err);
              alert("⚠️ 連線伺服器失敗，請檢查後端狀態。");
          }
      }
  });
})();