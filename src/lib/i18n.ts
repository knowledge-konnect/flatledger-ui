import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import te from '../locales/te.json';

const resources = {
  en: { translation: en },
  te: { translation: te },
};

/**
 * i18n configuration for FlatLedger.
 * Supported languages: English (en), Telugu (te).
 * The active language is persisted in localStorage under the 'lng' key so
 * the user's preference survives page reloads.
 */
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lng') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes values
  });

export default i18n;
