import { useId } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  size?: number;
  className?: string;
}

export function FlatLedgerIcon({ size = 40, className = '' }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const uid = useId().replace(/:/g, '');
  const bgGradId = `fl-bg-${uid}`;
  const buildingGradId = `fl-building-${uid}`;
  const bgFill = isDark ? '#000' : `url(#${bgGradId})`;
  const buildingFill = isDark ? `url(#${buildingGradId})` : 'white';
  const cutoutFill = isDark ? '#000' : '#047857';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgGradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id={buildingGradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" fill={bgFill} />
      <g transform="translate(4 4) scale(0.75)">
        <path d="M2 30V9H9V4H23V9H30V30H2Z" fill={buildingFill} />

        <rect x="11" y="8" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="15" y="8" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="19" y="8" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="11" y="12" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="15" y="12" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="19" y="12" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="11" y="16" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="15" y="16" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="19" y="16" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="11" y="20" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="15" y="20" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="19" y="20" width="2" height="3" rx="1" fill={cutoutFill} />

        <rect x="4" y="11" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="4" y="15" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="4" y="19" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="4" y="23" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="26" y="11" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="26" y="15" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="26" y="19" width="2" height="3" rx="1" fill={cutoutFill} />
        <rect x="26" y="23" width="2" height="3" rx="1" fill={cutoutFill} />

        <rect x="14" y="24" width="4" height="6" rx="0.5" fill={cutoutFill} />
      </g>
    </svg>
  );
}

