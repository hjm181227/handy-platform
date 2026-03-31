import i18next from 'i18next';
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, NAMESPACES } from './types';

// Korean
import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
import koProduct from './locales/ko/product.json';
import koOrder from './locales/ko/order.json';
import koMypage from './locales/ko/mypage.json';
import koNav from './locales/ko/nav.json';
import koError from './locales/ko/error.json';
import koNail from './locales/ko/nail.json';

// English
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enProduct from './locales/en/product.json';
import enOrder from './locales/en/order.json';
import enMypage from './locales/en/mypage.json';
import enNav from './locales/en/nav.json';
import enError from './locales/en/error.json';
import enNail from './locales/en/nail.json';

// Japanese
import jaCommon from './locales/ja/common.json';
import jaAuth from './locales/ja/auth.json';
import jaProduct from './locales/ja/product.json';
import jaOrder from './locales/ja/order.json';
import jaMypage from './locales/ja/mypage.json';
import jaNav from './locales/ja/nav.json';
import jaError from './locales/ja/error.json';
import jaNail from './locales/ja/nail.json';

const resources = {
  ko: {
    common: koCommon,
    auth: koAuth,
    product: koProduct,
    order: koOrder,
    mypage: koMypage,
    nav: koNav,
    error: koError,
    nail: koNail,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    product: enProduct,
    order: enOrder,
    mypage: enMypage,
    nav: enNav,
    error: enError,
    nail: enNail,
  },
  ja: {
    common: jaCommon,
    auth: jaAuth,
    product: jaProduct,
    order: jaOrder,
    mypage: jaMypage,
    nav: jaNav,
    error: jaError,
    nail: jaNail,
  },
};

// Get saved language or detect from browser/URL
function getInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    // Check URL query parameter first (?lang=en)
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && ['ko', 'en', 'ja'].includes(langParam)) {
      localStorage.setItem('handy-language', langParam);
      return langParam;
    }
    // Check localStorage
    const saved = localStorage.getItem('handy-language');
    if (saved && ['ko', 'en', 'ja'].includes(saved)) {
      return saved;
    }
    // Detect from browser
    const browserLang = navigator.language.split('-')[0];
    if (['ko', 'en', 'ja'].includes(browserLang)) {
      return browserLang;
    }
  }
  return DEFAULT_LANGUAGE;
}

const i18n = i18next.createInstance();

i18n.init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  ns: [...NAMESPACES],
  defaultNS: 'common',
  initImmediate: false,
  interpolation: {
    escapeValue: false,
  },
});

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('handy-language', lng);
  }
});

export default i18n;
export { i18n };
