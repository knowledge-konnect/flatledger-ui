import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, CreditCard, Calendar } from 'lucide-react';
import { usePlans } from '../hooks/usePlans';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../components/ui/Toast';

export const SubscriptionManager: React.FC = () => {
  const { showToast } = useToast();
  const {
    accessAllowed,
    status,
    trialDaysRemaining,
    planName,
    trialEnd,
    loading,
    error,
    subscribe,
    cancelSubscription,
    refreshStatus,
    clearError,
  } = useSubscription();

  // Plan selection state
  const { plans, plansLoading, plansError } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Set default selected plan when plans load
  React.useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const [subscribing, setSubscribing] = useState(false);
  const handleSubscribe = async () => {
    if (!selectedPlanId) return;
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;
    setSubscribing(true);
    try {
      await subscribe(plan.id, plan.monthlyAmount, 'razorpay', 'demo_ref');
      showToast('Subscription successful!', 'success');
      refreshStatus();
    } catch (error) {
      showToast('Subscription failed. Please try again.', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const [cancelling, setCancelling] = useState(false);
  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await cancelSubscription('User requested cancellation');
      showToast('Subscription cancelled.', 'info');
      refreshStatus();
    } catch (error) {
      showToast('Failed to cancel subscription.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'trial':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'expired':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {getStatusIcon()}
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={status === 'active' ? 'success' : status === 'trial' ? 'info' : 'error'}>
                  {status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
                {status === 'trial' && trialDaysRemaining !== null && (
                  <Badge variant="neutral">{trialDaysRemaining} days left</Badge>
                )}
              </div>
              {planName && (
                <div className="text-sm text-slate-500">Current Plan: <span className="font-semibold text-slate-900 dark:text-white">{planName}</span></div>
              )}
              {trialEnd && status === 'trial' && (
                <div className="text-xs text-slate-400">Trial ends: {new Date(trialEnd).toLocaleDateString()}</div>
              )}
              {status === 'expired' && (
                <div className="text-xs text-red-600">Your trial has ended. Please upgrade to continue.</div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${accessAllowed ? 'text-green-600' : 'text-red-600'}`}>{accessAllowed ? '✓ Access Granted' : '✗ Access Denied'}</div>
            </div>
          </div>
          {/* Plan Selection */}
          <div className="mt-6">
            <div className="mb-2 font-semibold text-slate-900 dark:text-white">Choose a Plan</div>
            {plansLoading ? (
              <div className="text-slate-500">Loading plans...</div>
            ) : plansError ? (
              <div className="text-red-500">{plansError}</div>
            ) : plans.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-4">
                {plans.map((plan: any) => (
                  <label
                    key={plan.id}
                    className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-start min-w-[160px] ${selectedPlanId === plan.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-600'}`}
                    tabIndex={0}
                    onClick={() => setSelectedPlanId(plan.id)}
                    onKeyPress={e => { if (e.key === 'Enter') setSelectedPlanId(plan.id); }}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={selectedPlanId === plan.id}
                      onChange={() => setSelectedPlanId(plan.id)}
                      className="mr-2 accent-indigo-600"
                      aria-label={`Select ${plan.name} plan`}
                    />
                    <span className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</span>
                    <span className="text-indigo-700 dark:text-indigo-300 font-bold text-xl">₹{plan.monthlyAmount}{plan.name.toLowerCase().includes('year') ? '/year' : '/month'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-slate-500">No plans available.</div>
            )}
          </div>
          {/* Actions */}
          <div className="flex gap-3 mt-6 flex-wrap">
            <Button
              variant="outline"
              onClick={refreshStatus}
              disabled={loading || subscribing || cancelling}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh Status
            </Button>
            {(status === 'trial' || status === 'expired' || status === 'cancelled') && plans.length > 0 && (
              <Button
                onClick={handleSubscribe}
                disabled={loading || subscribing || !selectedPlanId}
                isLoading={subscribing}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {subscribing ? 'Processing...' : 'Upgrade'}
              </Button>
            )}
            {status === 'active' && (
              <Button
                variant="danger"
                onClick={handleCancelSubscription}
                disabled={loading || cancelling}
                isLoading={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">✕</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Error Boundary for graceful error handling
interface SubscriptionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SubscriptionErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  SubscriptionErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SubscriptionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="p-6">
            <Alert variant="error">
              <AlertTriangle className="h-4 w-4" />
              <div className="text-sm">
                Something went wrong with the subscription manager.
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => this.setState({ hasError: false })}
                >
                  Try Again
                </Button>
              </div>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}