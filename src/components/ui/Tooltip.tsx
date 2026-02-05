import { ReactNode } from 'react';

export interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}

export default function Tooltip({ content, side = 'top', children }: TooltipProps) {
  const posClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  const arrowPos = {
    top: '-bottom-1 left-1/2 -translate-x-1/2',
    bottom: '-top-1 left-1/2 -translate-x-1/2',
    left: '-right-1 top-1/2 -translate-y-1/2',
    right: '-left-1 top-1/2 -translate-y-1/2',
  }[side];

  return (
    <div className="group inline-flex relative">
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute z-50 ${posClass} opacity-0 scale-95 transition-all duration-150 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg group-hover:opacity-100 group-hover:scale-100`}
      >
        {content}
        <div className={`absolute w-2 h-2 bg-slate-900 dark:bg-slate-700 transform rotate-45 ${arrowPos}`} />
      </div>
    </div>
  );
}
