/**
 * Goezshop 店鋪動態渲染與同步引擎
 * ====================================================================
 * 【核心定位】
 * 負責店鋪裝潢外觀（店名、描述、Logo商標）的「所見即所得」即時預覽與同步。
 * * 【運作流程】
 * 1. 狀態中心：暫存於 window.currentStoreData 全域物件中（UI與資料分離）。
 * 2. 渲染引擎：監聽左側輸入，動態生成 HTML 模具並重繪雙端（桌面/行動）預覽。
 * 3. 圖片上傳：選取Logo後，非同步背景上傳至 /api/upload-logo 並回傳網址。
 * 4. API 對接：負責載入賣場初始化資料，並將裝潢草稿/發布 JSON 送回後端更新。
 * 5. 更新文字欄位 (同步引擎)，打通桌面與行動雙端「信箱/電話」即時預覽連動
 * * 【注意事項】
 * * 本檔案僅負責「店鋪外觀裝潢」。
 * * 依據單一職責原則，任何「商品新增/刪除/管理」功能請一律寫在獨立的新檔案中。
 * ====================================================================
 *  由goez-store.html引用
 */

// 1. 全域資料中心：存放店鋪狀態
window.currentStoreData = {
    shopName: "", 
    shopDesc: "",
    logoUrl: "", // 存放圖片網址
    storeEmail: "", // 店鋪全域信箱狀態
    storePhone: "", // 店鋪全域電話狀態
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
 * 3. 桌面版商品模具 (已與前台同步：商品名旁顯示「剩餘XX」、購物車按鈕移至右下角獨立排版)
 */
function createDesktopHTML(p) {
    const name = p.ProductName || '新商品';
    const price = p.Price || 0;
    const img = p.ProductImg || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300';
    const desc = p.ProductDescription || '暫無商品描述';
    const stock = p.Stock !== undefined ? p.Stock : 0;
    const id = p.ProductID || '';

    // 抓取目前被選中的主題顏色
    const currentThemeName = document.querySelector('.theme-option.selected .theme-option__name')?.textContent.trim() || '冷靜石板';
    const activeColor = (typeof themes !== 'undefined' && themes[currentThemeName]) 
                        ? themes[currentThemeName]['--c-theme-1'] 
                        : '#6a8abaff';

    return `
    <div class="product-card" data-id="${id}" style="background: var(--c-white, #fff); border: 1px solid var(--c-border-light, #eaeaea); border-radius: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); overflow: hidden; display: flex !important; flex-direction: column !important; align-items: stretch !important; cursor: pointer; transition: transform 0.25s ease, box-shadow 0.25s ease; box-sizing: border-box; width: calc(33.333% - 14px); min-width: 200px; position: relative;">
      
      <!-- 商品圖片區 -->
      <div style="height: 180px; flex-shrink: 0; overflow: hidden; position: relative; background: #f5f5f5;">
        <img src="${img}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      
      <!-- 商品文字與資訊主體 -->
      <div style="padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 8px;">
        
        <!-- 名稱與剩餘數量行 -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <h4 style="margin: 0; font-family: 'Noto Sans TC', sans-serif; font-weight: 700; font-size: 16px; color: #333; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${name}</h4>
          <span style="font-family: 'Noto Sans TC', sans-serif; font-weight: 400; font-size: 12px; color: #888; white-space: nowrap; margin-top: 2px;">剩餘 ${stock}</span>
        </div>
        
        <!-- 商品描述欄位 -->
        <p style="color: #888; font-size: 12px; margin: 0; font-family: 'Noto Sans TC', sans-serif; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px;">
          ${desc}
        </p>
        
        <!-- 價格與購物車按鈕同一行 -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">  
        <span style="font-family: 'Noto Sans TC', sans-serif; font-weight: 900; font-size: 18px; color: ${activeColor}; line-height: 1;">$${price}</span>
          
          <!-- 桌面版刪除按鈕 -->
            <button class="delete-product-btn" data-id="${p.ProductID}" style="background: #ff4d4f; color: white; border: none; padding: 4px 8px; border-radius: 8px; cursor: pointer; font-size: 12px;">刪除</button>
          </div>

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

    </div>`;
}

/**
 * 4. 行動版商品模具 (等量調整，與桌面版風格一致)
 */
function createMobileHTML(p) {
    const name = p.ProductName || '新商品';
    const priceNum = parseFloat(p.Price);
    const displayPrice = !isNaN(priceNum) ? priceNum.toFixed(2) : (p.Price || '0.00');
    const desc = p.ProductDescription || '暫無商品描述';
    const img = p.ProductImg || '';
    const stock = p.Stock !== undefined ? p.Stock : 0;

    return `
    <div class="mobile-product-card" data-id="${p.ProductID || ''}" style="background: #fff; border: 1px solid #eaeaea; border-radius: 16px; padding: 12px; display: flex; gap: 12px; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        <div style="width: 80px; height: 80px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: #f5f5f5;">
            <img src="${img}" alt="${name}" style="width: 100%; height: 1005; object-fit: cover;" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; flex-grow: 1; overflow: hidden;">
            <div style="font-weight: 700; font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
            
            <p style="color: #888; font-size: 11px; margin: 0; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
                ${desc}
            </p>

            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 4px;">
                <span style="font-weight: 900; font-size: 15px; color: var(--c-theme-1, #2b4c7e);">$${displayPrice}</span>
                
                <span style="color: #888; font-size: 10px; background: #f5f7fa; padding: 2px 6px; border-radius: 4px;">
                    剩餘 ${stock}
                </span>

                <div style="display: flex; align-items: center; gap: 6px;">
                    <!-- 行動版刪除按鈕 -->
                    <button class="delete-product-btn" data-id="${p.ProductID}" style="background: #ff4d4f; color: white; border: none; padding: 3px 6px; border-radius: 6px; cursor: pointer; font-size: 10px;">刪除</button>

                <button style="background: var(--c-theme-1, #2b4c7e); border: none; border-radius: 10px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                </button>
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

    // 抓取最新輸入內容，沒填就是空字串
    const email = (window.currentStoreData.storeEmail || "").trim();
    const phone = (window.currentStoreData.storePhone || "").trim();

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
    // ==========================================
    // 🚀 Backend Lead 核心防爆：信箱「沒填就不顯示」邏輯
    // ==========================================
    const emailTexts = ['preview-email-desktop', 'preview-email-mobile'];
    const emailRows = ['row-email-desktop', 'row-email-mobile'];

    if (email === "") {
        // 沒填寫：雙端整行隱藏
        emailRows.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    } else {
        // 有填寫：把文字塞進去，並恢復顯示 (flex)
        emailTexts.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = email;
        });
        emailRows.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'flex';
        });
    }

    // ==========================================
    // 🚀 Backend Lead 核心防爆：電話「沒填就不顯示」邏輯
    // ==========================================
    const phoneTexts = ['preview-phone-desktop', 'preview-phone-mobile'];
    const phoneRows = ['row-phone-desktop', 'row-phone-mobile'];

    if (phone === "") {
        // 沒填寫：雙端整行隱藏
        phoneRows.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    } else {
        // 有填寫：把文字塞進去，並恢復顯示 (flex)
        phoneTexts.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = phone;
        });
        phoneRows.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'flex';
        });
    }
}

/**
 * 6. 儲存與發布邏輯 (API 對接)
 */
async function sendUpdateToBackend(isPublished) {
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('pageId'); 

    if (!pageId) return alert("找不到 PageID，請確認網址正確性");

    // 🎨 🚀 核心新增：在送出草稿前，從畫面上抓取目前選中的顏色與字體
    const selectedThemeEl = document.querySelector('.theme-option.selected .theme-option__name');
    const themeColor = selectedThemeEl ? selectedThemeEl.textContent.trim() : '冷靜石板';

    let themeFont = 'gothic'; // 預設黑體
    const selectedFontEl = document.querySelector('.font-option.selected');
    if (selectedFontEl) {
        if (selectedFontEl.classList.contains('font-option--gothic')) themeFont = 'gothic';
        else if (selectedFontEl.classList.contains('font-option--serif')) themeFont = 'serif';
        else if (selectedFontEl.classList.contains('font-option--round')) themeFont = 'round';
    }

    const payload = {
        isPublished: isPublished,
        shopName: window.currentStoreData.shopName,
        shopDesc: window.currentStoreData.shopDesc,
        logoUrl: window.currentStoreData.logoUrl,
        // 📥 將樣式加入大包裹送往後端
        themeColor: themeColor,
        themeFont: themeFont,
        // 🚀 修正：改用 innerText 抓取 div 的文字
        storeEmail: document.getElementById('store-email-input') ? document.getElementById('store-email-input').innerText.trim() : "",
        storePhone: document.getElementById('store-phone-input') ? document.getElementById('store-phone-input').innerText.trim() : ""
    };

    try {
        const response = await fetch(`/api/store/pages/${pageId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            alert(isPublished ? "🚀 發布成功！即將跳轉至買家前台查看成果。" : "草稿儲存成功！");
            
            // 💡 莊組長流暢加分點：如果是正式發布 (isPublished === true)，立刻執行跳轉
            if (isPublished) {
                window.location.href = `goez-store-template.html?pageId=${pageId}`;
            }
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
            console.log("📥 後端回傳的原始資料：", result); // 👈 F12 可以在這裡看後端吐什麼

            if (result.success && result.data) {
                const data = result.data;

                // 🛡️ 欄位防禦開滿！不管後端回傳大小寫或不同命名，通通抓得到
                window.currentStoreData.shopName = data.PageTitle || data.pageTitle || data.ShopName || "";
                window.currentStoreData.shopDesc = data.PageDescription || data.pageDescription || data.ShopDesc || "";
                window.currentStoreData.logoUrl = data.StoreLogo || data.storeLogo || "";
                window.currentStoreData.storeEmail = data.StoreEmail || data.storeEmail || "";
                window.currentStoreData.storePhone = data.StorePhone || data.storePhone || "";

                // 填回左側 Input（因為是 contenteditable 的 div，所以一律用 innerText！）
                const nIn = document.getElementById('store-name-input');
                const dIn = document.getElementById('store-desc-input');
                
                // 💡 只有當後端真的有資料時才覆蓋，避免空白覆蓋掉使用者的輸入
                if (nIn && window.currentStoreData.shopName) nIn.innerText = window.currentStoreData.shopName;
                if (dIn && window.currentStoreData.shopDesc) dIn.innerText = window.currentStoreData.shopDesc;

                const emailIn = document.getElementById('store-email-input');
                const phoneIn = document.getElementById('store-phone-input');

                if (emailIn && window.currentStoreData.storeEmail) {
                    emailIn.innerText = window.currentStoreData.storeEmail;
                }
                if (phoneIn && window.currentStoreData.storePhone) {
                    phoneIn.innerText = window.currentStoreData.storePhone;
                }

                // 3. 同步把預覽畫面也畫出來
                const previewEmailEl = document.querySelector('.preview-email') || document.getElementById('preview-email');
                const previewPhoneEl = document.querySelector('.preview-phone') || document.getElementById('preview-phone');

                if (previewEmailEl && window.currentStoreData.storeEmail) {
                    previewEmailEl.textContent = window.currentStoreData.storeEmail;
                }
                if (previewPhoneEl && window.currentStoreData.storePhone) {
                    previewPhoneEl.textContent = window.currentStoreData.storePhone;
                }

                // 【核心修復點】：把後端撈出來的商品陣列，安全塞進前端的全域狀態變數
                const productsList = data.PageProducts || data.pageProducts || data.Products || [];
                window.currentStoreData.products = productsList;
                
                if (typeof renderAll === 'function') {
                    renderAll(); // 讓畫面立刻把商品畫出來
                }

                // 🎨 核心新增：從後端撈回資料後，模擬真人點擊右側面板，重現顏色與字體
                setTimeout(() => {
                    // 1. 還原主題顏色
                    const savedColor = data.ThemeColor || data.themeColor || '冷靜石板';
                    document.querySelectorAll('.theme-option').forEach(opt => {
                        const name = opt.querySelector('.theme-option__name')?.textContent.trim();
                        if (name === savedColor) {
                            opt.click(); // 觸發前端變色
                        }
                    });

                    // 2. 還原字體
                    const savedFont = data.ThemeFont || data.themeFont || 'gothic';
                    const fontClassMap = {
                        'gothic': '.font-option--gothic',
                        'serif': '.font-option--serif',
                        'round': '.font-option--round'
                    };
                    const targetFontSelector = fontClassMap[savedFont];
                    if (targetFontSelector) {
                        document.querySelector(targetFontSelector)?.click(); // 觸發前端換字體
                    }

                    // 💡 莊組長終極核心防禦：在此補強初始化全域字體連動
                    let finalFontFamily = '"Noto Sans TC", "Arial", "Microsoft JhengHei", sans-serif';
                    if (savedFont === 'serif') {
                        finalFontFamily = '"Noto Serif TC", "Georgia", "PMingLiU", serif';
                    } else if (savedFont === 'gothic') {
                        finalFontFamily = '"Noto Sans TC", "Arial", "Microsoft JhengHei", sans-serif';
                    } else if (savedFont === 'round') {
                        finalFontFamily = '"Xingothic TC", "Noto Sans TC", "Arial", "Microsoft JhengHei", sans-serif';
                    }

                    document.documentElement.style.setProperty('--f-body', finalFontFamily);
                    console.log(`💪 [Backend Lead] 初始化全域變數打通成功：${savedFont} -> ${finalFontFamily}`);

                }, 100); // 延遲 100 毫秒確保前端元件已渲染完畢

            }
        } catch (err) { 
            console.warn('進入離線/空白模式', err); 
        }
    }

    // B. Logo 上傳連動
    const logoZone = document.getElementById('logo-drop-zone');
    const fileInput = document.getElementById('logo-file-input');

    if (logoZone && fileInput) {
        logoZone.onclick = (e) => {
            console.log("偵測到點擊！來源元素是:", e.target.id || e.target.className);
            e.preventDefault();  
            e.stopPropagation(); 
            if (isClicking) return; 
            
            isClicking = true; 
            fileInput.click();

            setTimeout(() => {
                isClicking = false;
            }, 500);
        };

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) { 
                alert("圖片太胖囉！請選擇小於 5MB 的圖片。");
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
                    updateLogoDisplay(); 
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

// 監聽信箱與電話輸入，即時同步至全域狀態中心，改用 innerText 監聽全域連動，重繪雙端
    const emailInputEl = document.getElementById('store-email-input');
    const phoneInputEl = document.getElementById('store-phone-input');

    if (emailInputEl) {
        emailInputEl.addEventListener('input', (e) => {
            // 確保使用 innerText 抓取 div 內的文字並同步至狀態中心
            window.currentStoreData.storeEmail = e.target.innerText.trim();
            updateTextFields(); // 🔥 關鍵：即時觸發上面的「顯示/隱藏與重繪」引擎！
        });
    }

    if (phoneInputEl) {
        phoneInputEl.addEventListener('input', (e) => {
            // 確保使用 innerText 抓取 div 內的文字並同步至狀態中心
            window.currentStoreData.storePhone = e.target.innerText.trim();
            updateTextFields(); // 🔥 關鍵：即時觸發上面的「顯示/隱藏與重繪」引擎！
        });
    }

    // ==========================================
    // 🎨 🚀 【修正版】：右側主題配色 4 色動態注入監聽
    // ==========================================
    const themes = {
        '冷靜石板': { '--c-accent': '#64748b', '--c-theme-1': '#64748b', '--c-theme-2': '#94a3b8', '--c-theme-3': '#cbd5e1', '--c-theme-4': '#f1f5f9' },
        '鼠尾草綠': { '--c-accent': '#869489', '--c-theme-1': '#869489', '--c-theme-2': '#a3ad9e', '--c-theme-3': '#c2c9bd', '--c-theme-4': '#e8ebe4' },
        '陶土橘': { '--c-accent': '#b38b7d', '--c-theme-1': '#b38b7d', '--c-theme-2': '#d1b4a6', '--c-theme-3': '#e5d3c8', '--c-theme-4': '#f5efea' },
        '北歐沙色': { '--c-accent': '#a8a29e', '--c-theme-1': '#a8a29e', '--c-theme-2': '#d6d3d1', '--c-theme-3': '#e7e5e4', '--c-theme-4': '#f5f5f4' }
    };

    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            const themeName = option.querySelector('.theme-option__name')?.textContent.trim();
            if (themes[themeName]) {
                const colors = themes[themeName];
                for (const [varName, colorValue] of Object.entries(colors)) {
                    document.documentElement.style.setProperty(varName, colorValue);
                }
                console.log(`🎨 [Theme Engine] 後台即時切換 4 色成功：${themeName}`);
            }
            
            // 💡 確保重新渲染時，商品資料保持不動，直接安心重繪
            if (typeof renderAll === 'function') {
                renderAll();
            }
        });
    });

    // 如果畫面載入時沒有任何被選中的主題，預設幫它選第一個，避免抓不到 .selected
    if (!document.querySelector('.theme-option.selected')) {
        const firstTheme = document.querySelector('.theme-option');
        if (firstTheme) firstTheme.classList.add('selected');
    }
    
    // D. 儲存按鈕監聽 
    const btnDraft = document.querySelector('.btn-draft'); 
    const btnPublish = document.querySelector('.btn-publish');
    if (btnDraft) btnDraft.addEventListener('click', () => sendUpdateToBackend(false));
    if (btnPublish) btnPublish.addEventListener('click', () => sendUpdateToBackend(true));

    renderAll();
});