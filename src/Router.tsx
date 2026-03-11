import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, memo } from 'react';
import MobileFAB from './components/ui/MobileFAB';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthProvider';

import LandingPage from './pages/LandingPage';

// Lazy load all pages for better performance
const Subscription = lazy(() => import('./pages/Subscription'));
const FreeTrial = lazy(() => import('./pages/FreeTrial'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Flats = lazy(() => import('./pages/Flats'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const MaintenanceLedger = lazy(() => import('./pages/MaintenanceLedger'));
const Expenses = lazy(() => import('./pages/Expenses'));
const CollectionSummary = lazy(() => import('./pages/reports/CollectionSummary'));
const Defaulters = lazy(() => import('./pages/reports/Defaulters'));
const IncomeVsExpense = lazy(() => import('./pages/reports/IncomeVsExpense'));
const FundLedger = lazy(() => import('./pages/reports/FundLedger'));
const PaymentRegister = lazy(() => import('./pages/reports/PaymentRegister'));
const ExpenseByCategory = lazy(() => import('./pages/reports/ExpenseByCategory'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const SubscriptionManagement = lazy(() => import('./pages/SubscriptionManagement'));
const OpeningBalanceEntry = lazy(() => import('./components/OpeningBalance/OpeningBalanceEntry'));
const Setup = lazy(() => import('./pages/Setup'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// Loading fallback component
const PageLoader = memo(function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-300">Loading...</p>
      </div>
    </div>
  );
});

export default function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { pathname } = useLocation();

  // Skip the auth gate on the public landing page so it renders immediately.
  // ProtectedRoute handles its own isLoading guard for all private routes.
  if (isLoading && pathname !== '/') {
    return <PageLoader />;
  }

  // If user is authenticated and needs to change password, redirect to change password page
  if (isAuthenticated && user && user.forcePasswordChange === true) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/change-password" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Render route tree based on final auth state
  // isAuthenticated is stable when we reach here (isLoading is false)
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          {/* Redirect logic: check isAuthenticated first to avoid rendering Login when authenticated */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} 
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Public SaaS pages */}
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/free-trial" element={<FreeTrial />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flats"
            element={
              <ProtectedRoute>
                <Flats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <Maintenance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flats/:publicId/ledger"
            element={
              <ProtectedRoute>
                <MaintenanceLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route path="/reports" element={<Navigate to="/reports/collection-summary" replace />} />
          <Route
            path="/reports/collection-summary"
            element={<ProtectedRoute><CollectionSummary /></ProtectedRoute>}
          />
          <Route
            path="/reports/defaulters"
            element={<ProtectedRoute><Defaulters /></ProtectedRoute>}
          />
          <Route
            path="/reports/income-vs-expense"
            element={<ProtectedRoute><IncomeVsExpense /></ProtectedRoute>}
          />
          <Route
            path="/reports/fund-ledger"
            element={<ProtectedRoute><FundLedger /></ProtectedRoute>}
          />
          <Route
            path="/reports/payment-register"
            element={<ProtectedRoute><PaymentRegister /></ProtectedRoute>}
          />
          <Route
            path="/reports/expense-by-category"
            element={<ProtectedRoute><ExpenseByCategory /></ProtectedRoute>}
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/opening-balance"
            element={
              <ProtectedRoute>
                <OpeningBalanceEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <Setup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription/manage"
            element={
              <ProtectedRoute>
                <SubscriptionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/premium-dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback - redirect based on auth state */}
          <Route 
            path="*" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} 
          />
        </Routes>
      </Suspense>

      {/* Mobile FAB for dashboard routes */}
      {isAuthenticated && <MobileFAB />}
    </>
  );
}
