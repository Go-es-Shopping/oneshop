/**
 * Goezshop 優惠券管理與 API 互動引擎
 * ====================================================================
 * 【核心定位】
 * 負責後台優惠券管理頁面之互動邏輯、折扣規則動態增刪，以及 API 資料串接。
 * 【運作流程】
 * 1. 動態規則管理：依據折扣類型（固定金額/百分比）即時調整欄位標籤與提示，支援多重規則項目的動態新增與刪除。
 * 2. 介面互動控制：處理「無時間限制」等 UI 狀態切換，自動化啟用或停用起訖日期欄位。
 * 3. 欄位防呆與收集：驗證並收集表單內各項優惠券設定（代碼、折扣、限制、期限等），並防呆安全地抓取動態規則。
 * 4. API 對接：將包裝好的 JSON 負載透過 POST /api/coupons 非同步傳送至後端進行建立，並處理回應與按鈕狀態。
 * 
 * 【注意事項】
 * * 本檔案僅負責「優惠券管理與建立」。
 * * 依據單一職責原則，任何與優惠券無關的店鋪裝潢或商品管理功能請一律寫在獨立的新檔案中。
 * ====================================================================
 * 由goez-coupon.html引用
 */

document.addEventListener('DOMContentLoaded', () => {
    const discountTypeSelect = document.getElementById('discount-type');
    const rulesWrapper = document.getElementById('discount-rules-wrapper');
    const rulesList = document.getElementById('discount-rules-list');
    const addRuleBtn = document.getElementById('add-rule-btn');

    const getRightColumnInfo = (type) => {
        if (type === 'percentage') {
            return { label: '折扣百分比 例：10%請寫0.1', placeholder: '0.1' };
        } else {
            return { label: '折扣金額 100元請填100', placeholder: '50' };
        }
    };

    const updateRuleIndices = () => {
        const ruleItems = rulesList.querySelectorAll('.rule-item');
        ruleItems.forEach((item, index) => {
            const indexLabel = item.querySelector('.rule-index');
            if (indexLabel) {
                indexLabel.textContent = `#${index + 1}`;
            }
        });
    };

    const createRuleItem = () => {
        const currentType = discountTypeSelect.value;
        const rightInfo = getRightColumnInfo(currentType);
        
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'rule-item border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm';
        
        ruleDiv.innerHTML = `
            <div class="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <div class="flex items-center gap-1">
                    <button type="button" class="text-slate-400 hover:text-slate-600 p-1 cursor-move" title="拖曳排序">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                    </button>
                    <button type="button" class="delete-rule-btn text-slate-400 hover:text-red-500 border-l border-slate-200 pl-4 ml-2 py-1 transition-colors" title="刪除此規則">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                <div class="rule-index text-sm font-bold text-logo">#1</div>
            </div>
            <div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <div class="flex-1 p-4 bg-white">
                    <label class="text-xs font-medium text-slate-500 mb-1.5 block">金額滿X元 *</label>
                    <input type="number" min="0" placeholder="0" required class="rule-min-spend w-full border-none p-0 text-slate-900 focus:outline-none text-sm bg-transparent">
                </div>
                <div class="flex-1 p-4 bg-white">
                    <label class="dynamic-right-label text-xs font-medium text-slate-500 mb-1.5 block">${rightInfo.label} *</label>
                    <input type="number" min="0" step="0.01" placeholder="${rightInfo.placeholder}" required class="rule-value w-full border-none p-0 text-slate-900 focus:outline-none text-sm bg-transparent">
                </div>
            </div>
        `;

        ruleDiv.querySelector('.delete-rule-btn').addEventListener('click', () => {
            ruleDiv.remove();
            updateRuleIndices();
        });

        return ruleDiv;
    };

    discountTypeSelect.addEventListener('change', () => {
        if (discountTypeSelect.value) {
            rulesWrapper.classList.remove('hidden');
            const rightInfo = getRightColumnInfo(discountTypeSelect.value);
            if (rulesList.children.length === 0) {
                rulesList.appendChild(createRuleItem());
                updateRuleIndices();
            } else {
                rulesList.querySelectorAll('.dynamic-right-label').forEach(label => label.textContent = `${rightInfo.label} *`);
                rulesList.querySelectorAll('.rule-value').forEach(input => input.placeholder = rightInfo.placeholder);
            }
        } else {
            rulesWrapper.classList.add('hidden');
        }
    });

    addRuleBtn.addEventListener('click', () => {
        rulesList.appendChild(createRuleItem());
        updateRuleIndices();
    });

    const noTimeLimitCheckbox = document.getElementById('no-time-limit');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    noTimeLimitCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        startDateInput.disabled = isChecked;
        endDateInput.disabled = isChecked;
        if (isChecked) {
            startDateInput.value = "";
            endDateInput.value = "";
        } else {
            startDateInput.value = "2026-01-01";
            endDateInput.value = "2026-12-01";
        }
    });

    // 核心表單提交：對應前端 HTML 欄位並透過 API 傳送至後端
    const form = document.getElementById('couponForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // 收集基本欄位資料（加入防呆避免找不到元素報錯）
        const getValue = (CouponID) => {
            const el = document.getElementById(CouponID);
            return el ? el.value.trim() : '';
        };

        const title = getValue('coupon-name');
        const code = getValue('coupon-code');
        const discountType = discountTypeSelect ? discountTypeSelect.value : '';
        const usageLimit = getValue('limit-uses') ? Number(getValue('limit-uses')) : null;
        const totalQuantity = getValue('total-issue') ? Number(getValue('total-issue')) : null;
        const noCombineEl = document.getElementById('no-combine');
        const isExclusive = noCombineEl && noCombineEl.checked ? 1 : 0;
        
        const noTimeLimit = noTimeLimitCheckbox ? noTimeLimitCheckbox.checked : false;
        const startDate = noTimeLimit ? null : (getValue('start-date') || null);
        const endDate = noTimeLimit ? null : (getValue('end-date') || null);

        // 安全地收集動態規則（透過尋找 input 欄位而不是寫死的 class）
        const rules = [];
        if (rulesList) {
            const ruleItems = rulesList.querySelectorAll('.rule-item');
            ruleItems.forEach(item => {
                const inputs = item.querySelectorAll('input');
                if (inputs.length >= 2) {
                    const minSpendVal = inputs[0].value;
                    const valueVal = inputs[1].value;
                    if (minSpendVal !== '' && valueVal !== '') {
                        rules.push({
                            minSpend: Number(minSpendVal),
                            discountValue: Number(valueVal)
                        });
                    }
                }
            });
        }
// 讓 MinSpend 直接對應動態規則的第一筆金額門檻（若有填寫的話）
const minSpend = rules.length > 0 ? rules[0].minSpend : null;

const payload = {
    Title: title,
    Code: code,
    DiscountType: discountType,
    MinSpend: minSpend, // 這裡會自動帶入動態規則的第一筆金額
    UsageLimit: usageLimit,
    TotalQuantity: totalQuantity,
    IsExclusive: isExclusive,
    StartDate: startDate,
    EndDate: endDate,
    Rules: rules
};

        submitBtn.textContent = "處理中...";
        submitBtn.classList.add('opacity-80', 'cursor-not-allowed');

        try {
            const response = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                submitBtn.textContent = "建立成功 ✓";
                submitBtn.classList.remove('bg-btn', 'hover:bg-btn-hover');
                submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                
                setTimeout(() => {
                    form.reset();
                    if (rulesWrapper) rulesWrapper.classList.add('hidden');
                    if (rulesList) rulesList.innerHTML = '';
                    submitBtn.textContent = originalText;
                    submitBtn.classList.remove('opacity-80', 'cursor-not-allowed', 'bg-green-600', 'hover:bg-green-700');
                    submitBtn.classList.add('bg-btn', 'hover:bg-btn-hover');
                }, 1500);
            } else {
                alert('建立失敗: ' + result.message);
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
            }
        } catch (error) {
            console.error('API 請求發生錯誤:', error);
            alert('伺服器連線失敗，請稍後再試');
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
        }
    });
});