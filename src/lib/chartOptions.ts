import { formatCurrency } from './utils';

export const axisLabelStyle = {
  colors: '#1e293b',
  fontSize: '11px',
};

export const baseChartOptions = {
  chart: {
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    animations: { enabled: true, speed: 400 },
  },
  dataLabels: { enabled: false },
};

export const baseGrid = {
  borderColor: '#E2E8F0',
};

export function currencyK(value: number): string {
  return `₹${(value / 1000).toFixed(0)}k`;
}

export function currencyTooltip(value: number): string {
  return formatCurrency(value);
}
