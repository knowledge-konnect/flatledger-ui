import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

type ErrorBoundaryVariant = 'society' | 'admin';

const VARIANT_CONFIG: Record<ErrorBoundaryVariant, {
  redirectPath: string;
  buttonLabel: string;
  accentClass: string;
}> = {
  society: {
    redirectPath: '/dashboard',
    buttonLabel: 'Return to Dashboard',
    accentClass: 'from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30',
  },
  admin: {
    redirectPath: '/admin/dashboard',
    buttonLabel: 'Return to Admin Dashboard',
    accentClass: 'from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30',
  },
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  variant?: ErrorBoundaryVariant;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
  }

  private handleReset = () => {
    const { variant = 'society' } = this.props;
    this.setState({ hasError: false, error: null });
    window.location.href = VARIANT_CONFIG[variant].redirectPath;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { variant = 'society' } = this.props;
      const config = VARIANT_CONFIG[variant];

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${config.accentClass} flex items-center justify-center`}>
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              We're sorry for the inconvenience. The error has been logged and we'll look into it.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <Button onClick={this.handleReset} variant="primary" className="w-full">
              {config.buttonLabel}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
