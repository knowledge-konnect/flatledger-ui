import { ReactNode, useRef, useState, useCallback } from 'react';

export interface TooltipProps {
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}

export default function Tooltip({ content, side = 'top', children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [nudgeX, setNudgeX] = useState(0);
  const [nudgeY, setNudgeY] = useState(0);
  const tipRef = useRef<HTMLDivElement>(null);

  const handleEnter = useCallback(() => {
    setShow(true);
    requestAnimationFrame(() => {
      if (!tipRef.current) return;
      const r = tipRef.current.getBoundingClientRect();
      const gap = 8;
      let dx = 0;
      let dy = 0;
      if (r.right > window.innerWidth - gap)  dx = window.innerWidth - gap - r.right;
      else if (r.left < gap)                  dx = gap - r.left;
      if (r.bottom > window.innerHeight - gap) dy = window.innerHeight - gap - r.bottom;
      else if (r.top < gap)                    dy = gap - r.top;
      setNudgeX(dx);
      setNudgeY(dy);
    });
  }, []);

  const handleLeave = useCallback(() => {
    setShow(false);
    setNudgeX(0);
    setNudgeY(0);
  }, []);

  const isVertical = side === 'top' || side === 'bottom';

  // Base positioning class (no translate for vertical — we handle it via style)
  const posClass = {
    top:    'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left:   'right-full top-1/2 mr-2',
    right:  'left-full top-1/2 ml-2',
  }[side];

  const baseStyle: React.CSSProperties = isVertical
    ? { left: '50%', transform: `translateX(calc(-50% + ${nudgeX}px)) translateY(${nudgeY}px)` }
    : { top: '50%',  transform: `translateX(${nudgeX}px) translateY(calc(-50% + ${nudgeY}px))` };

  // Arrow: keep centred on trigger, counteract nudge so it stays anchored
  const arrowStyle: React.CSSProperties = isVertical
    ? { left: '50%', transform: `translateX(calc(-50% - ${nudgeX}px)) rotate(45deg)` }
    : { top:  '50%', transform: `translateX(0) translateY(calc(-50% - ${nudgeY}px)) rotate(45deg)` };

  const arrowEdge = { top: '-bottom-1', bottom: '-top-1', left: '-right-1', right: '-left-1' }[side];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      <div
        ref={tipRef}
        role="tooltip"
        style={baseStyle}
        className={`pointer-events-none absolute z-50 ${posClass}
          w-max max-w-[min(240px,calc(100vw-1rem))] whitespace-normal break-words
          bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium
          rounded-md px-2.5 py-1.5 shadow-lg
          transition-all duration-150
          ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        {content}
        <div
          className={`absolute w-2 h-2 bg-slate-900 dark:bg-slate-700 ${arrowEdge}`}
          style={arrowStyle}
        />
      </div>
    </div>
  );
}
