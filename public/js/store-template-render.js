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

        // 4. 🚀 Backend Lead 核心防爆與動態帶入：Footer 聯絡資訊、簡介與店名
        const email = data.StoreEmail || data.storeEmail || '';
        const phone = data.StorePhone || data.storePhone || '';
        const tagline = data.tagline || '';

        // 處理信箱
        const footerEmailEl = document.querySelector('.store-footer__contact-email');
        const footerEmailRow = footerEmailEl ? footerEmailEl.closest('.store-footer__contact-row') : null;
        if (!email) {
            if (footerEmailRow) footerEmailRow.style.display = 'none';
        } else {
            if (footerEmailEl) footerEmailEl.textContent = email;
            if (footerEmailRow) footerEmailRow.style.display = 'flex';
        }

        // 處理電話
        const footerPhoneEl = document.querySelector('.store-footer__contact-phone');
        const footerPhoneRow = footerPhoneEl ? footerPhoneEl.closest('.store-footer__contact-row') : null;
        if (!phone) {
            if (footerPhoneRow) footerPhoneRow.style.display = 'none';
        } else {
            if (footerPhoneEl) footerPhoneEl.textContent = phone;
            if (footerPhoneRow) footerPhoneRow.style.display = 'flex';
        }

        // 🚀 處理 Footer 左下角商店簡介（帶你回到1989）
        const footerDescEl = document.querySelector('.store-footer__desc');
        if (footerDescEl && tagline) {
            footerDescEl.textContent = tagline;
        }

        // 處理 Footer 品牌名稱與版權宣告
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
            //tag: p.category || '熱門商品',
            tag: '', // 因移除商品分類，改為讓它變成空字串，不顯示標籤
            price: Number(p.price) || 0,
            origPrice: p.origPrice ? Number(p.origPrice) : null,
            stock: (p.stock !== undefined) ? p.stock : 0,
            badge: p.badge || null,
            desc: p.description || '享受美好質感生活',
            img: p.imageUrl || '',
            emoji: '🛍️',
            gradientClass: 'placeholder-gradient-' + ((index % 4) + 1)
        }));

        renderProducts('all');

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
              <span class="product-card__stock ${p.stock <= 5 ? 'low' : ''}">剩餘 ${p.stock}</span>
            </div>
            <div class="product-card__name">${p.name}</div>
            <div style="color: var(--c-text-faint); font-size: 13px; font-family: 'Noto Sans TC', sans-serif; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; margin-top: -2px;">${p.desc}</div>
            <div class="product-card__footer">
              <div>
                <span class="product-card__price">$${p.price.toLocaleString()}.00</span>
                ${p.origPrice ? `<span class="product-card__price-orig">$${p.origPrice.toLocaleString()}</span>` : ''}
              </div>
              <button class="product-card__cart-btn" type="button" aria-label="加入購物車"
                onclick="event.stopPropagation(); addToCart(${p.id})">
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
    if (modalStock) modalStock.textContent = `剩餘 ${p.stock} 件`;

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