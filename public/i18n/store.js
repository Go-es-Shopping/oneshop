// store.js - 賣場前台專用多語言字典檔
(function () {
  if (!window.GoezI18n) return;
  GoezI18n.register({
    'zh-Hant': {
      pageTitleStore: 'Goez Shop - 精選線上賣場',
      navHome: '首頁',
      navAllProducts: '所有商品',
      navAbout: '關於我們',
      navLookupOrder: '查詢訂單',
      curatedSlogan: '精選好物 · 品味生活',
      btnShopNow: '立即選購',
      btnLearnBrand: '瞭解品牌',
      hotProductsTitle: '熱門商品',
      viewMore: '查看更多',
      loading: '載入中...',
      toastAddedToCart: '✓ {name} 已加入購物車',    

      // ── 平台商品與卡片狀態 ──
      emptyProductsSection: '此區域暫無商品',
      stockSoldOut: '已售完',
      stockPrefix: '剩餘',
      unitPiece: '件',
      btnAddToCart: '加入購物車',
      toastAllProductsShown: '已顯示全部商品',

      // ── 優惠券橫幅 ──
      btnClaimCoupon: '立即領取',
      couponBannerDiscountPercent: '全館精選商品 {val} 折',
      couponBannerDiscountMinSpend: '滿 {min} 元折 {val} 元',
      couponBannerDiscountFixed: '現折 {val} 元',
      couponBannerValidity: '使用期限：',
      couponBannerAlwaysValid: '期限內皆可使用',
      couponBannerNoCombine: '不可與其他優惠券並用',
      toastCopiedCoupon: '已複製優惠碼：{code}',
      promptCopyCoupon: '請手動複製您的優惠碼：',

      // ── 搜尋覆蓋層 ──
      searchPlaceholder: '搜尋商品…',
      searchPrompt: '輸入關鍵字搜尋商品',
      searchNoResult: '找不到「{query}」的相關商品',

      // ── 購物車抽屜 ──
      cartDrawerTitle: '購物車',
      modalCloseAria: '關閉',
      cartEmpty: '購物車是空的',
      cartDrawerTotalLabel: '合計金額',
      btnGoToCheckout: '前往結帳',

      // ── 頁尾 ──
      previewQuickLinks: '快速連結',
      previewLatestProducts: '最新商品',
      previewPrivacy: '隱私條款',
      previewContactUs: '聯絡我們',
      footerQuickLinks: '快速連結',
      footerLatestProducts: '最新商品',
      footerPrivacy: '隱私條款',
      footerContactUs: '聯絡我們',
      footerRights: 'All rights reserved. Powered by Figma Make.'
    },
    en: {
      pageTitleStore: 'Goez Shop - Online Store',
      navHome: 'Home',
      navAllProducts: 'Products',
      navAbout: 'About Us',
      navLookupOrder: 'Track Order',
      curatedSlogan: 'Curated Goods · Tasteful Living',
      btnShopNow: 'Shop Now',
      btnLearnBrand: 'About Brand',
      hotProductsTitle: 'Hot Products',
      viewMore: 'View More',
      loading: 'Loading...',
      toastAddedToCart: '✓ {name} added to cart',

      // ── Platform Products & Status ──
      emptyProductsSection: 'No products in this section',
      stockSoldOut: 'Sold Out',
      stockPrefix: 'Stock:',
      unitPiece: 'pcs',
      btnAddToCart: 'Add to Cart',
      toastAllProductsShown: 'All products are now displayed',

      // ── Coupon Banner ──
      btnClaimCoupon: 'Claim Now',
      couponBannerDiscountPercent: '{val}% OFF featured items',
      couponBannerDiscountMinSpend: '${val} OFF orders over ${min}',
      couponBannerDiscountFixed: '${val} OFF',
      couponBannerValidity: 'Valid: ',
      couponBannerAlwaysValid: 'Always valid during campaign',
      couponBannerNoCombine: 'Cannot be combined with other coupons',
      toastCopiedCoupon: 'Coupon code copied: {code}',
      promptCopyCoupon: 'Please copy your code manually:',

      // ── Search Overlay ──
      searchPlaceholder: 'Search products...',
      searchPrompt: 'Enter keywords to search products',
      searchNoResult: 'No products found for "{query}"',

      // ── Cart Drawer ──
      cartDrawerTitle: 'Shopping Cart',
      modalCloseAria: 'Close',
      cartEmpty: 'Your cart is empty',
      cartDrawerTotalLabel: 'Total',
      btnGoToCheckout: 'Checkout',

      // ── Footer ──
      previewQuickLinks: 'Quick Links',
      previewLatestProducts: 'Latest Products',
      previewPrivacy: 'Privacy Policy',
      previewContactUs: 'Contact Us',
      footerQuickLinks: 'Quick Links',
      footerLatestProducts: 'Latest Products',
      footerPrivacy: 'Privacy Policy',
      footerContactUs: 'Contact Us',
      footerRights: 'All rights reserved. Powered by Figma Make.'
    },
    ja: {
      pageTitleStore: 'Goez Shop - オンラインストア',
      navHome: 'ホーム',
      navAllProducts: '商品一覧',
      navAbout: '会社概要',
      navLookupOrder: '注文照会',
      curatedSlogan: '厳選アイテム・心地よい暮らし',
      btnShopNow: '今すぐ購入',
      btnLearnBrand: 'ブランドについて',
      hotProductsTitle: 'おすすめ商品',
      viewMore: 'もっと見る',
      loading: '読み込み中...',
      toastAddedToCart: '✓ {name} をカートに追加しました',

      // ── プラットフォーム商品・状態 ──
      emptyProductsSection: 'このエリアには商品がありません',
      stockSoldOut: '売り切れ',
      stockPrefix: '残り',
      unitPiece: '点',
      btnAddToCart: 'カートに追加',
      toastAllProductsShown: '全商品を表示しました',

      // ── クーポンバナー ──
      btnClaimCoupon: '今すぐ獲得',
      couponBannerDiscountPercent: '対象商品 {val} 折',
      couponBannerDiscountMinSpend: '{min}円以上で {val}円引き',
      couponBannerDiscountFixed: '{val}円引き',
      couponBannerValidity: '有効期限：',
      couponBannerAlwaysValid: '期間中いつでも利用可能',
      couponBannerNoCombine: '他のクーポンと併用不可',
      toastCopiedCoupon: 'クーポンコードをコピーしました：{code}',
      promptCopyCoupon: 'クーポンコードを手動でコピーしてください：',

      // ── 検索オーバーレイ ──
      searchPlaceholder: '商品を検索…',
      searchPrompt: 'キーワードを入力して商品を検索',
      searchNoResult: '「{query}」に一致する商品が見つかりません',

      // ── ショッピングカート ──
      cartDrawerTitle: 'ショッピングカート',
      modalCloseAria: '閉じる',
      cartEmpty: 'カートは空です',
      cartDrawerTotalLabel: '合計金額',
      btnGoToCheckout: 'レジに進む',

      // ── フッター ──
      previewQuickLinks: 'クイックリンク',
      previewLatestProducts: '新着商品',
      previewPrivacy: 'プライバシーポリシー',
      previewContactUs: 'お問い合わせ',
      footerQuickLinks: 'クイックリンク',
      footerLatestProducts: '新着商品',
      footerPrivacy: 'プライバシーポリシー',
      footerContactUs: 'お問い合わせ',
      footerRights: 'All rights reserved. Powered by Figma Make.'
    }
  });
})();