/**
 * Goez Shop 共用多語言核心
 * 語系：中文、英文、日文
 * localStorage key：goezLang（全站共用）
 */
(function (global) {
  var STORAGE_KEY = 'goezLang';
  var LEGACY_KEYS = ['goezBuyerOrdersLang'];
  var DEFAULT_LANG = 'zh-Hant';

  var LANGS = [
    { code: 'zh-Hant', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
  ];

  var MESSAGES = {};

  function migrateLegacy() {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      for (var i = 0; i < LEGACY_KEYS.length; i++) {
        var legacy = localStorage.getItem(LEGACY_KEYS[i]);
        if (legacy) {
          localStorage.setItem(STORAGE_KEY, legacy);
          return;
        }
      }
    } catch (e) { /* ignore */ }
  }

  function getLang() {
    migrateLegacy();
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && !LANGS.some(function (l) { return l.code === saved; })) {
        setLang(DEFAULT_LANG);
        return DEFAULT_LANG;
      }
      if (saved && (MESSAGES[saved] || saved === DEFAULT_LANG)) return saved;
      if (saved && LANGS.some(function (l) { return l.code === saved; })) return saved;
    } catch (e) { /* ignore */ }
    return DEFAULT_LANG;
  }

  function setLang(code) {
    if (!LANGS.some(function (l) { return l.code === code; })) code = DEFAULT_LANG;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) { /* ignore */ }
    return code;
  }

  function register(pack) {
    if (!pack) return;
    Object.keys(pack).forEach(function (lang) {
      if (!MESSAGES[lang]) MESSAGES[lang] = {};
      Object.keys(pack[lang] || {}).forEach(function (key) {
        MESSAGES[lang][key] = pack[lang][key];
      });
    });
  }

  function t(key, vars) {
    var lang = getLang();
    var dict = MESSAGES[lang] || MESSAGES[DEFAULT_LANG] || {};
    var fallback = MESSAGES[DEFAULT_LANG] || {};
    var text = dict[key] != null ? dict[key] : (fallback[key] != null ? fallback[key] : key);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        text = String(text).replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return text;
  }

  function apply(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key);
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (key) {
        document.title = t(key);
      }
    });
    document.documentElement.lang = getLang() === 'zh-Hant' ? 'zh-Hant' : getLang();
  }

  function mountSwitcher(selectEl, onChange) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    var current = getLang();
    LANGS.forEach(function (lang) {
      var opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = lang.label;
      if (lang.code === current) opt.selected = true;
      selectEl.appendChild(opt);
    });
    selectEl.addEventListener('change', function () {
      setLang(selectEl.value);
      apply();
      if (typeof onChange === 'function') onChange(selectEl.value);
    });
  }

  global.GoezI18n = {
    LANGS: LANGS,
    getLang: getLang,
    setLang: setLang,
    register: register,
    t: t,
    apply: apply,
    mountSwitcher: mountSwitcher,
  };
})(window);
