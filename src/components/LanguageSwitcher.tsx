import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span>{t('language')}:</span>
      <button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>
        English
      </button>
      <button onClick={() => changeLanguage('te')} disabled={i18n.language === 'te'}>
        తెలుగు
      </button>
    </div>
  );
};

export default LanguageSwitcher;
