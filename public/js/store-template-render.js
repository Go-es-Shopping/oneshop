/**
 * Goezshop 店鋪動態渲染與同步引擎
 * ====================================================================
 * 【核心定位】
 * 負責店鋪裝潢外觀（店名、描述、Logo商標）的「所見即所得」即時預覽與同步。
 * 
 * 【運作流程】
 * 1. 狀態中心：暫存於 window.currentStoreData 全域物件中（UI與資料分離）。
 * 2. 渲染引擎：監聽左側輸入，動態生成 HTML 模具並重繪雙端（桌面/行動）預覽。
 * 3. 圖片上傳：選取Logo後，非同步背景上傳至 /api/upload-logo 並回傳網址。
 * 4. API 對接：負責載入賣場初始化資料，並將裝潢草稿/發布 JSON 送回後端更新。
 * 5. 更新文字欄位 (同步引擎)，打通桌面與行動雙端「信箱/電話」即時預覽連動
 * 
 * 【注意事項】
 * * 本檔案僅負責「店鋪外觀裝潢」。
 * * 依據單一職責原則，任何「商品新增/刪除/管理」功能請一律寫在獨立的新檔案中。
 * ====================================================================
 *  由goez-store.html引用
 */

window.PRODUCTS = window.PRODUCTS || [];
let currentCategory = 'all';
let modalProductId = null;
let modalQtyVal = 1;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('pageId');

    if (!pageId) {
        console.error('網址沒有 pageId！');
        return;
    }

    try {
        const response = await fetch(`/api/store/template/${pageId}`);
        const result = await response.json();

        const data = result.success && result.data ? result.data : result;
        console.log("👉 後端回傳的完整 data 物件：", data);
        window.PRODUCTS = data.products; // 確保把後端的商品陣列指定給全域變數 PRODUCTS

        // ==========================================
        // 🎨 0. 優先執行：動態套用賣場主題色與字體 (防止畫面閃爍或未套用)
        // ==========================================
        const themeColorName = data.ThemeColor || data.themeColor;
        const accentColor = data.accentColor || data.AccentColor;
        const themeFont = data.ThemeFont || data.themeFont;

        // 定義主題色對應字典（加入 --c-accent 讓 footer 與按鈕同步變色）
        const themes = {
            '冷靜石板': {
              '--c-accent': '#64748b',
              '--c-accent-dark': '#475569', // 👈 補上這個
              '--c-theme-1': '#64748b',
              '--c-theme-2': '#94a3b8',
              '--c-theme-3': '#cbd5e1',
              '--c-theme-4': '#f1f5f9'
            },
            '鼠尾草綠': {
              '--c-accent': '#869489',
              '--c-accent-dark': '#657367', // 👈 補上這個
              '--c-theme-1': '#869489',
              '--c-theme-2': '#a3ad9e',
              '--c-theme-3': '#c2c9bd',
              '--c-theme-4': '#e8ebe4'
            },
            '陶土橘': {
              '--c-accent': '#b38b7d',
              '--c-accent-dark': '#8c685b', // 👈 補上這個
              '--c-theme-1': '#b38b7d',
              '--c-theme-2': '#d1b4a6',
              '--c-theme-3': '#e5d3c8',
              '--c-theme-4': '#f5efea'
            },
            '北歐沙色': {
              '--c-accent': '#a8a29e',
              '--c-accent-dark': '#78716c', // 👈 補上這個
              '--c-theme-1': '#a8a29e',
              '--c-theme-2': '#d6d3d1',
              '--c-theme-3': '#e7e5e4',
              '--c-theme-4': '#f5f5f4'
            }
        };

        // 優先套用「整套主題色系列」
        let applied = false;
        if (themeColorName && themes[themeColorName]) {
            const selectedTheme = themes[themeColorName];
            for (const [varName, colorValue] of Object.entries(selectedTheme)) {
                document.documentElement.style.setProperty(varName, colorValue);
            }
            applied = true;
        }

        // 如果沒有對應的主題名稱，但有單獨的 accentColor，才用單一顏色補底
        if (!applied && accentColor) {
            document.documentElement.style.setProperty('--c-accent', accentColor);
        }

        // 定義字體對應字典
        const fontFamilies = {
            'gothic': "'Noto Sans TC', sans-serif",
            'serif':  "'Noto Serif TC', serif",
            'round':  "'M PLUS Rounded 1c', 'Noto Sans TC', sans-serif"
        };

        // 強制套用字體到整頁的所有元素（用 * 覆蓋掉子元件被寫死的字體）
        if (themeFont && fontFamilies[themeFont]) {
            const fontValue = fontFamilies[themeFont];
            document.body.style.fontFamily = fontValue;
            
            // 建立一個即時注入的 style 標籤，強制讓所有標題與文字統一吃這個字體
            const styleId = 'dynamic-font-override';
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = `
                body, *, button, input, select, textarea, h1, h2, h3, h4, h5, h6 {
                    font-family: ${fontValue} !important;
                }
            `;
        }
        // 1. 填入店名
        const nameEl = document.querySelector('.store-nav__name');
        if (nameEl && data.name) nameEl.textContent = data.name;

        // 2. 填入 Logo
        const logoContainer = document.querySelector('.store-nav__logo');
        if (logoContainer && data.logoUrl) {
            logoContainer.innerHTML = `<img src="${data.logoUrl}" alt="Store Logo" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
        }

        // 3. 填入商店簡介
        const taglineEl = document.querySelector('.store-hero__tagline');
        if (taglineEl && data.tagline) taglineEl.textContent = data.tagline;

        // 4. 🚀 Footer 聯絡資訊、簡介與店名
        const email = data.StoreEmail || data.storeEmail || '';
        const phone = data.StorePhone || data.storePhone || '';
        const tagline = data.tagline || '';

        const footerEmailEl = document.querySelector('.store-footer__contact-email');
        const footerEmailRow = footerEmailEl ? footerEmailEl.closest('.store-footer__contact-row') : null;
        if (!email) {
            if (footerEmailRow) footerEmailRow.style.display = 'none';
        } else {
            if (footerEmailEl) footerEmailEl.textContent = email;
            if (footerEmailRow) footerEmailRow.style.display = 'flex';
        }

        const footerPhoneEl = document.querySelector('.store-footer__contact-phone');
        const footerPhoneRow = footerPhoneEl ? footerPhoneEl.closest('.store-footer__contact-row') : null;
        if (!phone) {
            if (footerPhoneRow) footerPhoneRow.style.display = 'none';
        } else {
            if (footerPhoneEl) footerPhoneEl.textContent = phone;
            if (footerPhoneRow) footerPhoneRow.style.display = 'flex';
        }

        const footerDescEl = document.querySelector('.store-footer__desc');
        if (footerDescEl && tagline) {
            footerDescEl.textContent = tagline;
        }

        const footerBrandEl = document.querySelector('.store-footer__brand');
        if (footerBrandEl && data.name) footerBrandEl.textContent = data.name;

        const footerCopyrightEl = document.querySelector('.store-footer__copyright');
        if (footerCopyrightEl && data.name) {
            footerCopyrightEl.innerHTML = `© 2026 ${data.name}. All rights reserved. Powered by Goez Shop.`;
        }

        // 5. 轉換商品資料
        const rawProducts = data.products || [];
        
        window.PRODUCTS = rawProducts.map((p, index) => ({
            id: p.id || index,
            name: p.name || '新商品',
            tag: '', 
            price: Number(p.price) || 0,
            origPrice: p.origPrice ? Number(p.origPrice) : null,
            stock: (p.stock !== undefined) ? p.stock : 0,
            badge: p.badge || null,
            desc: p.description || '享受美好質感生活',
            img: p.imageUrl || '',
            emoji: '🛍️',
            gradientClass: 'placeholder-gradient-' + ((index % 4) + 1)
        }));

        // 6. 渲染商品與優惠券
        renderProducts('all');

        // 👇 【修正】從後端回傳的商店資料中取得真正的 sellerID（支援大小寫屬性）
        const realSellerId = data.SellerID || data.sellerID;
        if (realSellerId) {
            loadStoreCoupons(realSellerId); // 傳入真實的 SellerID（例如 15）
        } else {
            console.error('無法從商店資料中取得 SellerID');
        }
 } catch (err) {
        console.error('載入資料失敗：', err);
    }
});



function renderProducts(category = 'all') {
    const grid = document.getElementById('productsGrid') || document.querySelector('.store-products__grid');
    if (!grid) {
        console.error('找不到商品容器！');
        return;
    }

    // 【強制修正】確保網格容器本身有正確的 Grid 排版與顯示樣式，絕對不會隱形
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))';
    grid.style.gap = '24px';
    grid.style.width = '100%';
    grid.style.minHeight = '200px';

    const products = (category === 'all')
        ? window.PRODUCTS
        : window.PRODUCTS.filter(p => p.tag === category);

    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--c-text-faint);font-family:\'Noto Sans TC\',sans-serif;">此分類暫無商品</p>';
        return;
    }

    grid.innerHTML = products.map((p, i) => `
        <article class="product-card" aria-label="${p.name}" onclick="openProductModal(${p.id})" style="cursor: pointer;">
          <div class="product-card__image-area ${p.img ? '' : 'product-card__image-area--empty ' + p.gradientClass}">
            ${p.img ? `<img src="${p.img}" alt="${p.name}">` : `<div class="placeholder-art">${p.emoji}</div>`}
            ${p.badge ? `<span class="product-card__badge">${p.badge}</span>` : ''}
          </div>
          <div class="product-card__body">
            <div class="product-card__meta">
              <div class="product-card__tag"><span class="product-card__tag-text">${p.tag}</span></div>
              <span class="product-card__stock ${p.stock === 0 ? 'out-of-stock' : (p.stock <= 5 ? 'low' : '')}">
  ${p.stock === 0 ? '已售完' : `剩餘 ${p.stock}`}
</span>
            </div>
            <div class="product-card__name">${p.name}</div>
            <div style="color: var(--c-theme-2); font-size: 13px; font-family: 'Noto Sans TC', sans-serif; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; margin-top: -2px;">${p.desc}</div>
            <div class="product-card__footer">
              <div>
                <span class="product-card__price">$${p.price.toLocaleString()}.00</span>
                ${p.origPrice ? `<span class="product-card__price-orig">$${p.origPrice.toLocaleString()}</span>` : ''}
              </div>
              <button class="product-card__cart-btn" type="button" aria-label="加入購物車"
  ${p.stock === 0 ? 'disabled style="background-color: #cbd5e1; cursor: not-allowed;"' : `onclick="event.stopPropagation(); addToCart(${p.id})"`}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.33333 14.6667C5.70152 14.6667 6 14.3682 6 14C6 13.6318 5.70152 13.3333 5.33333 13.3333C4.96514 13.3333 4.66666 13.6318 4.66666 14C4.66666 14.3682 4.96514 14.6667 5.33333 14.6667Z" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.6667 14.6667C13.0349 14.6667 13.3333 14.3682 13.3333 14C13.3333 13.6318 13.0349 13.3333 12.6667 13.3333C12.2985 13.3333 12 13.6318 12 14C12 14.3682 12.2985 14.6667 12.6667 14.6667Z" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/><path d="M1.36667 1.36667H2.7L4.47334 9.64667C4.53839 9.94991 4.70712 10.221 4.95048 10.4132C5.19384 10.6055 5.49661 10.7069 5.80667 10.7H12.3267C12.6301 10.6995 12.9243 10.5955 13.1607 10.4052C13.397 10.2149 13.5614 9.94969 13.6267 9.65333L14.7267 4.7H3.41334" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </article>
    `).join('');
}

// 彈跳視窗控制
function openProductModal(productId) {
    const p = window.PRODUCTS.find(pr => pr.id === productId);
    if (!p) return;
    modalProductId = productId;
    modalQtyVal = 1;

    const modalTag = document.getElementById('modalTag');
    if (modalTag) modalTag.textContent = p.tag;

    const modalName = document.getElementById('modalName');
    if (modalName) modalName.textContent = p.name;

    const modalDesc = document.getElementById('modalDesc');
    if (modalDesc) modalDesc.textContent = p.desc;

    const modalPrice = document.getElementById('modalPrice');
    if (modalPrice) modalPrice.textContent = `$${p.price.toLocaleString()}.00`;

    const modalStock = document.getElementById('modalStock');
if (modalStock) {
    if (p.stock === 0) {
        modalStock.textContent = '已售完';
        modalStock.style.color = '#ef4444'; // 顯示紅色警示
    } else {
        modalStock.textContent = `剩餘 ${p.stock} 件`;
        modalStock.style.color = '';
    }
}

    const modalQty = document.getElementById('modalQty');
    if (modalQty) modalQty.textContent = '1';

    const imgArea = document.getElementById('modalImg');
    if (imgArea) {
        if (p.img) {
            imgArea.className = 'product-modal__img';
            imgArea.innerHTML = `<img src="${p.img}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            imgArea.className = 'product-modal__img ' + p.gradientClass;
            imgArea.innerHTML = `<div id="modalImgPlaceholder" style="font-size: 60px; display:flex; align-items:center; justify-content:center; height:100%;">${p.emoji}</div>`;
        }
    }

    const modalOverlay = document.getElementById('productModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modalOverlay = document.getElementById('productModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function handleModalOverlayClick(e) {
    const modalOverlay = document.getElementById('productModalOverlay');
    if (e.target === modalOverlay) closeModal();
}

function changeModalQty(delta) {
    const p = window.PRODUCTS.find(pr => pr.id === modalProductId);
    if (!p) return;
    modalQtyVal = Math.max(1, Math.min(modalQtyVal + delta, p.stock));
    const modalQty = document.getElementById('modalQty');
    if (modalQty) modalQty.textContent = modalQtyVal;
}

function addModalToCart() {
    if (modalProductId && typeof addToCart === 'function') {
        addToCart(modalProductId, modalQtyVal);
        closeModal();
    }
}

function filterCategory(category, btn) {
    currentCategory = category;
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderProducts(category);
}

/* ══════════════════════════════════
    查看更多與 Toast 提示
══════════════════════════════════ */
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    // 如果頁面沒有 toast 元素，自動建立一個完美的漂浮小黑框
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #364649ff;
      color: #fff;
      padding: 10px 24px;
      border-radius: 30px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.3s ease, opacity 0.3s ease;
      opacity: 0;
      z-index: 9999;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.transform = 'translateX(-50%) translateY(0)';
  toast.style.opacity = '1';

  // 1.5秒後自動收回
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.opacity = '0';
  }, 1500);
}

function showAllProducts() {
  showToast('已顯示全部商品');
}

/* ══════════════════════════════════
    賣場前台優惠券動態渲染模組
══════════════════════════════════ */
async function loadStoreCoupons(sellerId) {
  try {
    const response = await fetch(`/api/coupons?sellerID=${sellerId}`);
    const result = await response.json();
    
    const container = document.getElementById('coupon-banner-container');
    if (!container) return;

    if (result.success && result.list && result.list.length > 0) {
      container.innerHTML = ''; // 清空

      console.log("準備渲染的優惠券資料：", result.list);
      result.list.forEach(coupon => {
        let discountDesc = '';
        if (coupon.DiscountType === 'percentage') {
          discountDesc = `全館精選商品 ${coupon.DiscountValue} 折`;
        } else {
          discountDesc = coupon.MinSpend ? `滿 ${coupon.MinSpend} 元折 ${coupon.DiscountValue} 元` : `現折 ${coupon.DiscountValue} 元`;
        }

        const startDate = coupon.StartDate ? coupon.StartDate.split('T')[0].replace(/-/g, '/') : '';
        const endDate = coupon.EndDate ? coupon.EndDate.split('T')[0].replace(/-/g, '/') : '';
        const timeDesc = startDate && endDate ? `使用期限：${startDate} - ${endDate}` : '期限內皆可使用';
        const ruleDesc = coupon.IsExclusive ? ' | 不可與其他優惠券並用' : '';

        const bannerHTML = `
          <div class="promo-banner" style="margin: 0 24px 40px; background: var(--c-accent, #869489) !important; border-radius: 24px; padding: 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px; position: relative;">
            <div class="promo-banner__text" style="position: relative; z-index: 1;">
              <div class="promo-banner__title" style="font-size: 20px; font-weight: 900; color: #ffffff !important; margin-bottom: 6px;">${coupon.Title}</div>
              <div class="promo-banner__sub" style="font-size: 13px; color: rgba(255,255,255,0.9) !important; line-height: 1.5;">${discountDesc}<br>${timeDesc}${ruleDesc}</div>
            </div>
            <button class="promo-banner__btn claim-btn" data-code="${coupon.Code}" style="background: #ffffff !important; color: var(--c-accent, #869489) !important; font-weight: 700; font-size: 14px; padding: 10px 20px; border-radius: 50px; border: none; cursor: pointer; white-space: nowrap;">立即領取</button>
          </div>
        `;
        container.innerHTML += bannerHTML;
      });

      document.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const code = this.getAttribute('data-code');
          navigator.clipboard.writeText(code).then(() => {
            showToast(`記住優惠碼：${code}`);
          }).catch(err => {
            console.error('複製失敗', err);
            prompt('請手動複製您的優惠碼：', code);
          });
        });
      });

    } else {
      container.innerHTML = '';
    }
  } catch (error) {
    console.error('載入前台優惠券失敗:', error);
  }
}