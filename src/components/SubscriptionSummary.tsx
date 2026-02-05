import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { CheckCircle, Calendar, XCircle, AlertTriangle, Crown } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export const SubscriptionSummary: React.FC = () => {
  const navigate = useNavigate();
  const { status, trialDaysRemaining, planName, monthlyAmount, loading } = useSubscription();

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

  const getActionButton = () => {
    if (status === 'trial' || status === 'expired' || status === 'cancelled') {
      return (
        <Button size="sm" onClick={() => navigate('/subscription/manage')} data-testid="upgrade-btn">
          <Crown className="h-4 w-4" />
          Upgrade
        </Button>
      );
    }
    return (
      <Button variant="secondary" size="sm" onClick={() => navigate('/subscription/manage')} data-testid="view-details-btn">
        View Details
      </Button>
    );
  };

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-4" data-testid="subscription-loading">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2" />
        <span className="text-sm text-slate-500">Loading...</span>
      </Card>
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
              {monthlyAmount && ` - ₹${monthlyAmount}/month`}
            </p>
          )}
        </div>
        {getActionButton()}
      </div>
    </Card>
  );
};
