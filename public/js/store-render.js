document.addEventListener('DOMContentLoaded', async () => {
    // 1. 抓取「所有」商品容器 (確保桌面版與行動版同步)
    const productGrids = document.querySelectorAll('.store-products__grid');

    try {
        // 2. 向後端 API 請求資料
        const response = await fetch('/api/products');
        const products = await response.json();

        if (products.length > 0) {
            // 💡 A. 渲染商品列表 (同時更新所有容器)
            productGrids.forEach(grid => {
                grid.innerHTML = ''; // 清空原本寫死的預設商品

                products.forEach(p => {
                    const productHtml = `
                    <article class="product-card" aria-label="${p.ProductName}">
                        <div class="product-card__image-area">
                            <img src="${p.ProductImg}" alt="${p.ProductName}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                        <div class="product-card__body">
                            <div class="product-card__meta">
                                <div class="product-card__tag">
                                    <span class="product-card__tag-text">精選商品</span>
                                </div>
                                <span class="product-card__stock">剩餘 ${p.Stock}</span>
                            </div>
                            <div class="product-card__name">${p.ProductName}</div>
                            <div class="product-card__footer">
                                <span class="product-card__price">$${p.Price}</span>
                                <button class="product-card__cart-btn" type="button">
                                    <img src="/Users/lc/Desktop/store/shopping-cart.svg" alt="加入購物車" />
                                </button>
                            </div>
                        </div>
                    </article>`;
                    grid.insertAdjacentHTML('beforeend', productHtml);
                });
            });

            // 💡 B. 同步更新店鋪資訊
            const firstProduct = products[0];

            // 3. 更新「導航欄店名」(上面圈圈：改掉原本的「風格生活選物」)
            // 我們針對 header 裡的文字進行更新
            const navShopNames = document.querySelectorAll('.store-header__title, .header__logo-text');
            navShopNames.forEach(el => {
                el.innerText = firstProduct.ShopName;
            });

            // 4. 更新「左側編輯欄」(桌面版側邊資訊)
            const leftNameDiv = document.getElementById('store-name-input');
            const leftDescDiv = document.getElementById('store-desc-input');
            if (leftNameDiv) leftNameDiv.innerText = firstProduct.ShopName;
            if (leftDescDiv) leftDescDiv.innerText = firstProduct.ShopDescription;

            // 5. 確保「熱門商品」標題不被誤改 (下面圈圈)
            // 將所有區塊標題強制設回「熱門商品」
            const sectionHeadings = document.querySelectorAll('.store-products__heading-text');
            sectionHeadings.forEach(h => {
                h.innerText = '熱門商品';
            });
        }
    } catch (err) {
        console.error('全端渲染失敗：', err);
    }
});