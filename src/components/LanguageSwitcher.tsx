import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className, compact = false }) => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
  };

  const isEnglish = i18n.resolvedLanguage === 'en';
  const isTelugu = i18n.resolvedLanguage === 'te';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t('language')}:
        </span>
      )}
      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          disabled={isEnglish}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-default',
            isEnglish
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('te')}
          disabled={isTelugu}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-default',
            isTelugu
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          )}
        >
          తెలుగు
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
