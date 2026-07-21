// � THEME_MAP：完整樣式配置表
const THEME_MAP = {
    // 主題色彩配置（與賣家編輯器完全一致）
    colors: {
        '冷靜石板': {
            '--c-theme-1': '#64748b',
            '--c-theme-2': '#94a3b8',
            '--c-theme-3': '#cbd5e1',
            '--c-theme-4': '#f1f5f9'
        },
        '鼠尾草綠': {
            '--c-theme-1': '#869489',
            '--c-theme-2': '#a3ad9e',
            '--c-theme-3': '#c2c9bd',
            '--c-theme-4': '#e8ebe4'
        },
        '陶土橘': {
            '--c-theme-1': '#b38b7d',
            '--c-theme-2': '#d1b4a6',
            '--c-theme-3': '#e5d3c8',
            '--c-theme-4': '#f5efea'
        },
        '北歐沙色': {
            '--c-theme-1': '#a8a29e',
            '--c-theme-2': '#d6d3d1',
            '--c-theme-3': '#e7e5e4',
            '--c-theme-4': '#f5f5f4'
        }
    },
    // 字體配置（對應賣家編輯器的三種字體選項）
    fonts: {
        'gothic': {
            class: 'font-gothic',
            css: '"Noto Sans TC", "Arial", "Microsoft JhengHei", sans-serif'
        },
        'serif': {
            class: 'font-serif',
            css: '"Noto Serif TC", "Georgia", "PMingLiU", serif'
        },
        'round': {
            class: 'font-round',
            css: '"Xingothic TC", "Noto Sans TC", "Arial", "Microsoft JhengHei", sans-serif'
        }
    },
    // 預設值
    defaults: {
        color: '冷靜石板',
        font: 'gothic'
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. 取得網址 pageId
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('pageId');

    if (!pageId) {
        console.warn("⚠️ [Theme Engine] 偵測到網址沒有帶 pageId！");
        return;
    }

    console.log(`🚀 [Theme Engine] 開始初始化賣場，PageID: ${pageId}`);

    try {
        // 2. 呼叫 API 取得賣場完整設定
        const response = await fetch(`/api/store/template/${pageId}`);
        const storeData = await response.json();

        if (storeData) {
            console.log(`� [Theme Engine] 後端資料擷取成功！`, storeData);

            // 3. 同步基本賣場資訊至 STORE_CONFIG
            STORE_CONFIG.name = storeData.PageTitle || storeData.shopName || storeData.name || '';
            STORE_CONFIG.tagline = storeData.PageDescription || storeData.shopDesc || storeData.tagline || '';
            STORE_CONFIG.logoUrl = storeData.StoreLogo || storeData.logoUrl || '';

            // 4. 🎨 動態主題色注入
            // 優先使用後端儲存的主題色，若無則使用預設值（支援大小寫）
            const savedColorName = storeData.ThemeColor || storeData.themeColor || THEME_MAP.defaults.color;
            console.log(`🎨 解析主題色彩名稱: "${savedColorName}"`);

            // 從 THEME_MAP 中提取對應的色彩配置
            const colorConfig = THEME_MAP.colors[savedColorName] || THEME_MAP.colors[THEME_MAP.defaults.color];
            
            // 無條件將所有主題色 CSS 變數注入到 DOM
            Object.keys(colorConfig).forEach(cssVar => {
                const colorValue = colorConfig[cssVar];
                document.documentElement.style.setProperty(cssVar, colorValue);
                console.log(`   ✓ 設定 ${cssVar} = ${colorValue}`);
            });

            // 同時同步到 STORE_CONFIG 供後續使用
            STORE_CONFIG.accentColor = colorConfig['--c-theme-1'];
            STORE_CONFIG.themeName = savedColorName;

            // 5. ✍️ 動態字體注入
            // 優先使用後端儲存的字體，若無則使用預設值（支援大小寫）
            const savedFontName = storeData.ThemeFont || storeData.themeFont || THEME_MAP.defaults.font;
            console.log(`✍️ 解析字體名稱: "${savedFontName}"`);

            // 從 THEME_MAP 中提取對應的字體配置
            const fontConfig = THEME_MAP.fonts[savedFontName] || THEME_MAP.fonts[THEME_MAP.defaults.font];

            // 1. 將字體 class 加到 body（用於 CSS 樣式控制）
            document.body.classList.add(fontConfig.class);

            // 2. 同時也設定全域 CSS 變數 --f-body（保險起見）
            document.documentElement.style.setProperty('--f-body', fontConfig.css);
            console.log(`   ✓ 套用字體 class: ${fontConfig.class}`);
            console.log(`   ✓ 設定 --f-body = ${fontConfig.css}`);

            // 同步到 STORE_CONFIG
            STORE_CONFIG.fontFamily = savedFontName;

            // 6. 📦 商品資料同步
            let allProducts = storeData.products || storeData.PageProducts || [];
            if (storeData.categories && !storeData.products && !storeData.PageProducts) {
                storeData.categories.forEach(cat => {
                    if (cat.products) {
                        allProducts = allProducts.concat(cat.products);
                    }
                });
            }

            STORE_CONFIG.products = allProducts.map((p, index) => ({
                id: p.id || p.ProductID || index + 1,
                name: p.name || p.ProductName || '未命名商品',
                price: p.price || p.Price || 0,
                imageUrl: p.imageUrl || p.ProductImg || '',
                description: p.description || p.ProductDescription || '',
                stock: p.stock || p.Stock || 0,
                category: p.category || '熱門商品'
            }));

            // 7. 📧 頁尾聯絡資訊
            if (!STORE_CONFIG.footer) STORE_CONFIG.footer = {};
            STORE_CONFIG.footer.email = storeData.StoreEmail || storeData.storeEmail || '';
            STORE_CONFIG.footer.phone = storeData.StorePhone || storeData.storePhone || '';
            STORE_CONFIG.footer.description = storeData.footerDescription || '';

            // 8. �️ 渲染文字內容
            function renderStoreContent() {
                // 店名與標語
                const navNameEl = document.getElementById('navName');
                const heroTaglineEl = document.getElementById('heroTagline');
                if (navNameEl) navNameEl.textContent = STORE_CONFIG.name;
                if (heroTaglineEl) heroTaglineEl.textContent = STORE_CONFIG.tagline;

                // 頁尾聯絡資訊
                const contactItemsEl = document.querySelector('.store-footer__contact-items');
                if (contactItemsEl) {
                    contactItemsEl.innerHTML = `
                        <div class="contact-row">📧 ${STORE_CONFIG.footer.email || ''}</div>
                        <div class="contact-row">📞 ${STORE_CONFIG.footer.phone || ''}</div>
                    `;
                }
            }
            renderStoreContent();

            // 9. 🛒 商品渲染
            if (typeof renderProducts === 'function') {
                renderProducts('all');
            }

            console.log(`✨ [Theme Engine] 賣場渲染完成！主題: ${savedColorName}, 字體: ${savedFontName}`);
        }
    } catch (error) {
        console.error("❌ [Theme Engine] 賣場載入失敗:", error);
    }
});
