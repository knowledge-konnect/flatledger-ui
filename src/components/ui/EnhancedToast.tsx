import { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function EnhancedToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: 'bg-green-600 border-green-700 text-white',
    error: 'bg-red-600 border-red-700 text-white',
    info: 'bg-blue-600 border-blue-700 text-white',
    warning: 'bg-amber-600 border-amber-700 text-white',
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Overlay for toasts, if needed, with blur (optional, can be omitted if not desired) */}
      {/* Toast content, always above overlay, no blur */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map((toast, index) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={cn(
                'p-4 rounded-lg border-2 shadow-lg', // removed backdrop-blur-sm from toast content
                'animate-slide-in-right',
                styles[toast.type]
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{toast.message}</p>
                  {toast.action && (
                    <button
                      onClick={toast.action.onClick}
                      className="mt-2 text-xs font-semibold text-white underline hover:no-underline"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current animate-progress"
                  style={{ animationDuration: `${toast.duration || 5000}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
