import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { CheckCircle, Calendar, XCircle, AlertTriangle, Crown } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface SubscriptionSummaryProps {
  compact?: boolean;
}

export const SubscriptionSummary: React.FC<SubscriptionSummaryProps> = ({ compact = false }) => {
  const navigate = useNavigate();
  const { status, trialDaysRemaining, planName, loading, error } = useSubscription();

  console.log('🔍 [SubscriptionSummary] State:', { status, trialDaysRemaining, planName, loading, error });

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'trial':
        return <Calendar className="h-5 w-5 text-info-500" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-error-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
    }
  };

  const getStatusBadgeVariant = (): 'success' | 'info' | 'error' | 'primary' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trial':
        return 'info';
      case 'expired':
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  // Always show Upgrade button for testing, but restore previous navigation
  const getActionButton = () => {
    return (
      <Button size="sm" onClick={() => navigate('/subscription/manage')} data-testid="upgrade-btn">
        <Crown className="h-4 w-4" />
        Upgrade
      </Button>
    );
  };

  if (loading) {
    if (compact) return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 animate-pulse">
        <div className="h-3 w-12 rounded bg-slate-300 dark:bg-slate-600" />
        <div className="h-3 w-16 rounded bg-slate-300 dark:bg-slate-600" />
      </div>
    );
    return (
      <Card className="flex items-center justify-center p-4" data-testid="subscription-loading">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2" />
        <span className="text-sm text-slate-500">Loading subscription...</span>
      </Card>
    );
  }

  if (error) {
    if (compact) return null;
    return (
      <Card className="p-4" data-testid="subscription-error">
        <div className="flex items-center gap-2 text-error-600">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  if (!status) {
    if (compact) return null;
    return (
      <Card className="p-4" data-testid="subscription-no-data">
        <div className="flex items-center gap-2 text-slate-500">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">No subscription data available</span>
        </div>
      </Card>
    );
  }

  // ── Compact inline variant (for embedding in header) ─────────────────────
  if (compact) {
    const statusColors: Record<string, string> = {
      active:    'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
      trial:     'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      expired:   'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
      cancelled: 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    };
    const colorClass = statusColors[status] ?? statusColors.trial;
    return (
      <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${colorClass}`}>
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{getStatusIcon()}</span>
        <span className="capitalize">{status}</span>
        {status === 'trial' && trialDaysRemaining !== null && (
          <span className="opacity-70">· {trialDaysRemaining}d left</span>
        )}
        {planName && <span className="opacity-70 hidden sm:inline">· {planName}</span>}
        <button
          onClick={() => navigate('/subscription/manage')}
          className="ml-1 flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2 py-0.5 text-xs font-semibold transition-colors"
        >
          <Crown className="h-3 w-3" />
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <Card data-testid="subscription-summary">
      <div className="flex items-center gap-2 mb-4">
        {getStatusIcon()}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Subscription</h3>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant()}>
              {status?.toUpperCase()}
            </Badge>
            {status === 'trial' && trialDaysRemaining !== null && (
              <Badge variant="neutral">
                {trialDaysRemaining} days left
              </Badge>
            )}
          </div>
          {planName && (
            <p className="text-sm text-slate-500">
              {planName}
            </p>
          )}
          {status === 'trial' && trialDaysRemaining !== null && (
            <p className="text-xs text-info-600">Your free trial is active. Enjoy all features for {trialDaysRemaining} more day{trialDaysRemaining === 1 ? '' : 's'}.</p>
          )}
          {status === 'expired' && (
            <p className="text-xs text-error-600">Your trial has ended. Please contact support to renew your subscription.</p>
          )}
        </div>
        {getActionButton()}
      </div>
    </Card>
  );
};
