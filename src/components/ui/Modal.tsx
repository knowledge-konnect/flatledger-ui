import { X } from 'lucide-react';
import { Children, isValidElement, ReactNode, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
  };

  // Separate ModalFooter from other children
  let footerContent: ReactNode = null;
  let bodyContent: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === ModalFooter) {
      footerContent = child;
    } else {
      bodyContent.push(child);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="modal-overlay">
      {/* Overlay with blur, below content */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal content, always above overlay, no blur */}
      <div
        className={cn(
          'relative z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900',
          'max-h-[90vh] flex flex-col animate-scale-in',
          sizes[size]
        )}
        data-testid="modal-content"
      >
        {(title || showCloseButton) && (
          <div className="flex-shrink-0 flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
            {title && (
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="-mr-2 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                data-testid="modal-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {bodyContent}
        </div>

        {footerContent}
      </div>
    </div>
  );
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex-shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:px-5', 'flex items-center justify-end gap-2.5', className)}>
      {children}
    </div>
  );
}
