/**
 * Goezshop 動態渲染系統 - Backend Lead 整合最終版
 */

// 1. 全域資料中心：存放店鋪狀態
window.currentStoreData = {
    shopName: "", 
    shopDesc: "",
    logoUrl: "", // 存放圖片網址
    products: []
};

// 2. 渲染總開關：刷新右側預覽畫面
function renderAll() {
    const desktopGrid = document.getElementById('product-list');
    const mobileGrid = document.getElementById('mobile-product-list');

    if (desktopGrid) desktopGrid.innerHTML = '';
    if (mobileGrid) mobileGrid.innerHTML = '';

    if (window.currentStoreData.products.length === 0) {
        const emptyMsg = `<p style="grid-column: 1/-1; text-align:center; padding:40px; color:#999; width:100%;">目前尚無商品</p>`;
        if (desktopGrid) desktopGrid.innerHTML = emptyMsg;
        if (mobileGrid) mobileGrid.innerHTML = emptyMsg;
    } else {
        window.currentStoreData.products.forEach(p => {
            if (desktopGrid) desktopGrid.insertAdjacentHTML('beforeend', createDesktopHTML(p));
            if (mobileGrid) mobileGrid.insertAdjacentHTML('beforeend', createMobileHTML(p));
        });
    }

    // 同步更新所有文字位置、Logo
    updateTextFields();
    updateLogoDisplay(); 
}

// 更新所有 Logo 顯示位置
function updateLogoDisplay() {
    const url = window.currentStoreData.logoUrl || "https://www.figma.com/api/mcp/asset/665605e6-519c-4fa0-8070-daa26e795351";
    
    const logoIds = ['logo-preview-img', 'preview-logo-desktop', 'preview-logo-mobile'];
    logoIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.src = url;
    });
}
/**
 * 3. 桌面版商品模具
 */
function createDesktopHTML(p) {
    return `
    <article class="product-card">
        <div class="product-card__image-area ${!p.ProductImg ? 'product-card__image-area--empty' : ''}">
            <img src="${p.ProductImg || ''}" alt="${p.ProductName}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div class="product-card__body">
            <div class="product-card__meta">
                <div class="product-card__tag"><span class="product-card__tag-text">精選商品</span></div>
                <span class="product-card__stock">剩餘 ${p.Stock || 0}</span>
            </div>
            <div class="product-card__name">${p.ProductName}</div>
            <div class="product-card__footer">
                <span class="product-card__price">$${p.Price}</span>
                <button class="product-card__cart-btn"><img src="/Users/lc/Desktop/store/shopping-cart.svg" /></button>
            </div>
        </div>
    </article>`;
}

/**
 * 4. 行動版商品模具
 */
function createMobileHTML(p) {
    return `
    <div class="mobile-product-card">
        <div class="mobile-product-card__img ${!p.ProductImg ? 'mobile-product-card__img--empty' : ''}">
            <img src="${p.ProductImg || ''}" alt="${p.ProductName}" />
        </div>
        <div class="mobile-product-card__body">
            <span class="mobile-product-card__tag">精選商品</span>
            <div class="mobile-product-card__name">${p.ProductName}</div>
            <div class="mobile-product-card__footer">
                <span class="mobile-product-card__price">$${p.Price}</span>
                <button class="mobile-product-card__cart">購物車</button>
            </div>
        </div>
    </div>`;
}

/**
 * 5. 更新文字欄位 (同步引擎)
 */
function updateTextFields() {
    // 優先序：輸入內容 > 預設提示
    const name = window.currentStoreData.shopName || "載入中...";
    const desc = window.currentStoreData.shopDesc || "載入中...";

    const nameIds = [
        'preview-name-desktop', 
        'preview-name-mobile', 
        'preview-footer-brand', 
        'preview-footer-brand-mobile',
        'preview-footer-copyright-desktop',
        'preview-footer-copyright-mobile'
    ];
    
    const descIds = [
        'preview-desc-desktop', 
        'preview-desc-mobile', 
        'preview-footer-desc', 
        'preview-footer-desc-mobile'
    ];

    nameIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = name;
    });

    descIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = desc;
    });
}

/**
 * 6. 儲存與發布邏輯 (API 對接)
 */
async function sendUpdateToBackend(isPublished) {
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('pageId'); 

    if (!pageId) return alert("找不到 PageID，請確認網址正確性");

    const logoImg = document.getElementById('logo-preview-img');
    
    const payload = {
        isPublished: isPublished,
        shopName: window.currentStoreData.shopName,
        shopDesc: window.currentStoreData.shopDesc,
        logoUrl: window.currentStoreData.logoUrl // 這裡送的是網址了
    };

    try {
        const response = await fetch(`/api/store/pages/${pageId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            alert(isPublished ? "發布成功！" : "草稿儲存成功！");
        } else {
            alert("儲存失敗：" + result.message);
        }
    } catch (err) {
        console.error("儲存出錯:", err);
        alert("儲存時發生錯誤，請檢查網路連線");
    }
}

/**
 * 7. 初始化啟動與事件監聽
 */
let isClicking = false; // 建立一把鎖

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('pageId');

    // A. 抓取初始資料
    if (pageId) {
        try {
            const response = await fetch(`/api/store/pages/${pageId}`);
            const result = await response.json();
            if (result.success && result.data) {
                window.currentStoreData.shopName = result.data.PageTitle || "";
                window.currentStoreData.shopDesc = result.data.PageDescription || "";
                window.currentStoreData.logoUrl = result.data.StoreLogo || "";
                
                // 填回左側 Input
                const nIn = document.getElementById('store-name-input');
                const dIn = document.getElementById('store-desc-input');
                if (nIn) nIn.innerText = window.currentStoreData.shopName;
                if (dIn) dIn.innerText = window.currentStoreData.shopDesc;
            }
        } catch (err) { console.warn('進入離線/空白模式'); }
    }

    // B. 🚀 新增：Logo 上傳連動
    const logoZone = document.getElementById('logo-drop-zone');
    const fileInput = document.getElementById('logo-file-input');

    if (logoZone && fileInput) {
    // 使用 onclick 並加入防止冒泡的邏輯，可以確保只會觸發一次檔案視窗
    logoZone.onclick = (e) => {
        // 🚩 印出 log 看看這個 function 被執行了幾次
        console.log("偵測到點擊！來源元素是:", e.target.id || e.target.className);
        e.preventDefault();  // 阻擋 HTML 預設行為
        e.stopPropagation(); // 阻擋事件向上冒泡
        if (isClicking) return; // 如果正在處理中，就直接回絕
        
        isClicking = true; // 上鎖
        fileInput.click();

        // 500 毫秒後自動解鎖，這段時間內的重複點擊都會被無視
        setTimeout(() => {
            isClicking = false;
        }, 500);
    };


        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // 在傳送給後端之前先檢查
            if (file.size > 5 * 1024 * 1024) { 
            alert("圖片太胖囉！請選擇小於 5MB 的圖片。");
            // 清除選擇的檔案，防止使用者硬要按上傳
            this.value = ""; 
            return;
            }

            const formData = new FormData();
            formData.append('logo', file);

            try {
                const res = await fetch('/api/upload-logo', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    window.currentStoreData.logoUrl = data.url;
                    updateLogoDisplay(); // 立即同步所有預覽圖
                }
            } catch (err) { alert("圖片上傳失敗"); }
        });
    }

    // C. 輸入框監聽 (維持原本)
    const nameInput = document.getElementById('store-name-input');
    const descInput = document.getElementById('store-desc-input');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            window.currentStoreData.shopName = e.target.innerText.trim();
            updateTextFields();
        });
    }
    if (descInput) {
        descInput.addEventListener('input', (e) => {
            window.currentStoreData.shopDesc = e.target.innerText.trim();
            updateTextFields();
        });
    }

    // D. 儲存按鈕監聽 (維持原本)
    const btnDraft = document.querySelector('.btn-draft'); 
    const btnPublish = document.querySelector('.btn-publish');
    if (btnDraft) btnDraft.addEventListener('click', () => sendUpdateToBackend(false));
    if (btnPublish) btnPublish.addEventListener('click', () => sendUpdateToBackend(true));

    renderAll();
});