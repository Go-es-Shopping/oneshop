(function () {
    if (!window.GoezI18n) return;
    GoezI18n.register({
        'zh-Hant': {
            pageTitleCoupon: 'Goez Shop - 新增優惠券',
            pageHeadingCoupon: '新增優惠券',
            requiredTag: '必填',
            // Section 1
            sectionCouponBasic: '優惠券',
            couponBasicDesc: '建議6個字以下，使用「數字」「全大寫英文」「全大寫英文＋數字」。',
            couponBasicHint: '* 應避免出現容易混淆的字，例：數字 1 英文小寫 l',
            couponNameLabel: '名稱',
            couponNamePlaceholder: '例如：2026年終優惠',
            couponCodeLabel: '代碼',
            couponCodePlaceholder: '例如：SAVE2026',
            // Section 2
            sectionDiscountType: '折扣類型',
            discountTypeDesc1: '可設定滿1000元9折，滿2000元8折。',
            discountTypeDesc2: '滿1000元折100，滿2000元折200...等等。',
            discountTypeLabel: '折扣種類',
            discountTypeSelectDefault: '請選擇種類',
            discountTypeFixed: '固定',
            discountTypePercentage: '百分比',
            // Dynamic Rules
            ruleMoveTo: '移動到',
            ruleDragTitle: '拖曳排序',
            ruleDeleteTitle: '刪除此規則',
            ruleSpendMinLabel: '金額滿X元',
            rulePercentLabel: '折扣百分比 例：10%請寫0.1',
            ruleFixedLabel: '折扣金額 100元請填100',
            // Section 3
            sectionUsageLimits: '使用限制',
            usageLimitsDesc: '設置優惠券的發放數量與使用條件限制。',
            limitUsesLabel: '使用次數上限',
            totalIssueLabel: '總發行量',
            noLimitPlaceholder: '不限制',
            unitTimes: '次',
            unitTickets: '張',
            noCombineLabel: '不可與其他優惠券並用',
            // Section 4
            sectionTimeLimit: '時間限制',
            timeLimitDesc: '設定此優惠券可被使用的有效期限。',
            startDateLabel: '開始時間',
            endDateLabel: '結束時間',
            noTimeLimitLabel: '無時間限制',
            // Actions & Status
            btnSaveSettings: '儲存設定',
            btnCancel: '取消',
            statusProcessing: '處理中...',
            statusSuccess: '建立成功 ✓'
        },
        en: {
            pageTitleCoupon: 'Goez Shop - Add Coupon',
            pageHeadingCoupon: 'Add Coupon',
            requiredTag: 'Required',
            // Section 1
            sectionCouponBasic: 'Coupon Info',
            couponBasicDesc: 'Recommended: under 6 chars, uppercase letters and/or numbers.',
            couponBasicHint: '* Avoid confusing characters, e.g., number 1 and lowercase l.',
            couponNameLabel: 'Name',
            couponNamePlaceholder: 'e.g. 2026 Year-End Sale',
            couponCodeLabel: 'Code',
            couponCodePlaceholder: 'e.g. SAVE2026',
            // Section 2
            sectionDiscountType: 'Discount Type',
            discountTypeDesc1: 'Tiered discounts: 10% off over $1000, 20% off over $2000.',
            discountTypeDesc2: 'Or fixed discounts: $100 off over $1000, $200 off over $2000, etc.',
            discountTypeLabel: 'Discount Category',
            discountTypeSelectDefault: 'Select category',
            discountTypeFixed: 'Fixed Amount',
            discountTypePercentage: 'Percentage',
            // Dynamic Rules
            ruleMoveTo: 'Move to',
            ruleDragTitle: 'Drag to reorder',
            ruleDeleteTitle: 'Delete rule',
            ruleSpendMinLabel: 'Order over $X',
            rulePercentLabel: 'Discount rate (e.g. 0.1 for 10% off)',
            ruleFixedLabel: 'Discount amount (e.g. 100 for $100 off)',
            // Section 3
            sectionUsageLimits: 'Usage Limits',
            usageLimitsDesc: 'Set total issuance and conditions for coupon usage.',
            limitUsesLabel: 'Usage Limit Per User',
            totalIssueLabel: 'Total Issuance',
            noLimitPlaceholder: 'Unlimited',
            unitTimes: 'times',
            unitTickets: 'tickets',
            noCombineLabel: 'Cannot be combined with other coupons',
            // Section 4
            sectionTimeLimit: 'Time Restrictions',
            timeLimitDesc: 'Define the active duration for this coupon.',
            startDateLabel: 'Start Date',
            endDateLabel: 'End Date',
            noTimeLimitLabel: 'No Expiration Date',
            // Actions & Status
            btnSaveSettings: 'Save Settings',
            btnCancel: 'Cancel',
            statusProcessing: 'Processing...',
            statusSuccess: 'Created Successfully ✓'
        },
        ja: {
            pageTitleCoupon: 'Goez Shop - クーポン追加',
            pageHeadingCoupon: 'クーポン新規追加',
            requiredTag: '必須',
            // Section 1
            sectionCouponBasic: '基本設定',
            couponBasicDesc: '推奨：6文字以下、大文字英数字の組み合わせ。',
            couponBasicHint: '* 混同しやすい文字（例：数字の1と小文字のl）はお避けください。',
            couponNameLabel: 'クーポン名',
            couponNamePlaceholder: '例：2026年末大感謝祭',
            couponCodeLabel: 'クーポンコード',
            couponCodePlaceholder: '例：SAVE2026',
            // Section 2
            sectionDiscountType: '割引タイプ',
            discountTypeDesc1: '段階的な割引設定：例：1,000円以上で10%OFF、2,000円以上で20%OFF。',
            discountTypeDesc2: 'または定額割引：1,000円以上で100円引、2,000円以上で200円引など。',
            discountTypeLabel: '割引種別',
            discountTypeSelectDefault: '種別を選択してください',
            discountTypeFixed: '定額割引',
            discountTypePercentage: '定率（パーセント）割引',
            // Dynamic Rules
            ruleMoveTo: '移動先',
            ruleDragTitle: 'ドラッグして並べ替え',
            ruleDeleteTitle: 'このルールを削除',
            ruleSpendMinLabel: '利用可能最低金額 (円)',
            rulePercentLabel: '割引率（例：10%引の場合は 0.1）',
            ruleFixedLabel: '割引額（例：100円引の場合は 100）',
            // Section 3
            sectionUsageLimits: '利用制限',
            usageLimitsDesc: '発行枚数や利用条件を設定します。',
            limitUsesLabel: '利用回数上限',
            totalIssueLabel: '総発行枚数',
            noLimitPlaceholder: '無制限',
            unitTimes: '回',
            unitTickets: '枚',
            noCombineLabel: '他のクーポンとの併用不可',
            // Section 4
            sectionTimeLimit: '有効期限',
            timeLimitDesc: 'このクーポンの有効期限を設定します。',
            startDateLabel: '開始日時',
            endDateLabel: '終了日時',
            noTimeLimitLabel: '有効期限なし',
            // Actions & Status
            btnSaveSettings: '設定を保存',
            btnCancel: 'キャンセル',
            statusProcessing: '処理中...',
            statusSuccess: '作成完了 ✓'
        }
    });
})();