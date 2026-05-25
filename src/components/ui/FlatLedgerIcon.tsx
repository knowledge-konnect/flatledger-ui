import { useTheme } from '../../contexts/ThemeContext';

export const FLAT_LEDGER_ICON_SIZES = {
  navbarDesktop: 40,
  navbarMobile: 36,
  authHero: 42,
  authCompact: 32,
  status: 48,
  loader: 48,
} as const;

interface Props {
  size?: number;
  className?: string;
}

export function FlatLedgerIcon({
  size = 40,
  className = '',
}: Props) {
  const { theme } = useTheme();
  const iconSrc = theme === 'dark' ? '/icons/icon-dark.svg' : '/icons/icon-light.svg';
  const fallbackPng = theme === 'dark' ? '/icons/icon-dark-32x32.png' : '/icons/icon-light-32x32.png';

  return (
    <img
      src={iconSrc}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      alt=""
      loading="eager"
      decoding="sync"
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src.endsWith('.svg')) {
          target.src = fallbackPng;
        }
      }}
    />
  );
}