import { ReactNode, useEffect, Children, isValidElement } from 'react';
import { X } from 'lucide-react';
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
    sm: 'max-w-modal-sm',
    md: 'max-w-modal',
    lg: 'max-w-modal-lg',
    xl: 'max-w-4xl',
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
          'relative z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full',
          'max-h-[90vh] flex flex-col animate-scale-in',
          sizes[size]
        )}
        data-testid="modal-content"
      >
        {/* Header - fixed at top */}
        {(title || showCloseButton) && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            {title && (
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                data-testid="modal-close-btn"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            )}
          </div>
        )}
        
        {/* Body - scrollable in the middle */}
        <div className="flex-1 overflow-y-auto">
          {bodyContent}
        </div>
        
        {/* Footer - fixed at bottom */}
        {footerContent}
      </div>
    </div>
  );
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800', className)}>
      {children}
    </div>
  );
}
