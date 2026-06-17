import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, memo } from 'react';
import MobileFAB from './components/ui/MobileFAB';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth, AuthProvider } from './contexts/AuthProvider';
import { FlatLedgerIcon, FLAT_LEDGER_ICON_SIZES } from './components/ui/FlatLedgerIcon';
import { RoleCode } from './types/roles';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Every top-level component is lazy-loaded so its code is NOT part of the
// initial JS bundle. This keeps the entry chunk small and only loads each
// module on first navigation to that route.
const AdminApp = lazy(() => import('./admin/AdminApp').then(m => ({ default: m.AdminApp })));

const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Contact = lazy(() => import('./pages/Contact'));
const Subscription = lazy(() => import('./pages/Subscription'));
const FreeTrial = lazy(() => import('./pages/FreeTrial'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
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
const DownloadReports = lazy(() => import('./pages/reports/DownloadReports'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const SubscriptionManagement = lazy(() => import('./pages/SubscriptionManagement'));
const OpeningBalanceEntry = lazy(() => import('./components/OpeningBalance/OpeningBalanceEntry'));
const Setup = lazy(() => import('./pages/Setup'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const Payment = lazy(() => import('./pages/Payment'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentGateways = lazy(() => import('./pages/PaymentGateways'));
const Suggestions = lazy(() => import('./pages/Suggestions'));

/**
 * Full-screen loading indicator shown while a lazy-loaded page chunk is being
 * fetched. Memoized to prevent unnecessary re-renders during Suspense fallback.
 */
const PageLoader = memo(function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white dark:bg-slate-950">
      <FlatLedgerIcon size={FLAT_LEDGER_ICON_SIZES.loader} className="rounded-xl animate-pulse" />
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-200 border-t-emerald-600"></div>
    </div>
  );
});

/**
 * All user-facing routes. Must be rendered inside <AuthProvider> so that
 * useAuth() is available to ProtectedRoute and page components.
 *
 * Auth flow:
 * 1. While auth state is loading, show PageLoader on protected paths.
 * 2. If the user has forcePasswordChange set, lock them to /change-password.
 * 3. Unauthenticated access to protected paths redirects to / with a reason param.
 */
function UserRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { pathname } = useLocation();

  const publicPaths = ['/', '/privacy', '/terms', '/contact', '/subscription', '/free-trial', '/login', '/signup', '/forgot-password', '/reset-password'];
  const protectedPaths = [
    '/dashboard', '/flats', '/maintenance', '/expenses', '/reports', '/users', '/settings', '/setup', '/payment', '/subscription/manage', '/subscription/renew', '/flats/', '/reports/'
  ];

  if (isLoading && !publicPaths.includes(pathname)) {
    return <PageLoader />;
  }

  // Redirect unauthenticated users away from protected paths.
  // Using startsWith handles nested routes like /flats/:id/ledger.
  const isProtected = protectedPaths.some(p => pathname === p || pathname.startsWith(p + '/') );
  if (!isAuthenticated && !isLoading && isProtected) {
    return <Navigate to="/" replace />;
  }

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

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/free-trial" element={<FreeTrial />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/flats" element={<ProtectedRoute><Flats /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/flats/:publicId/ledger" element={<ProtectedRoute><MaintenanceLedger /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/reports" element={<Navigate to="/reports/collection-summary" replace />} />
          <Route path="/reports/collection-summary" element={<ProtectedRoute><CollectionSummary /></ProtectedRoute>} />
          <Route path="/reports/defaulters" element={<ProtectedRoute><Defaulters /></ProtectedRoute>} />
          <Route path="/reports/income-vs-expense" element={<ProtectedRoute><IncomeVsExpense /></ProtectedRoute>} />
          <Route path="/reports/fund-ledger" element={<ProtectedRoute><FundLedger /></ProtectedRoute>} />
          <Route path="/reports/payment-register" element={<ProtectedRoute><PaymentRegister /></ProtectedRoute>} />
          <Route path="/reports/download-reports" element={<ProtectedRoute roles={[RoleCode.SOCIETY_ADMIN]}><DownloadReports /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={[RoleCode.SOCIETY_ADMIN]}><Users /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={[RoleCode.SOCIETY_ADMIN]}><Settings /></ProtectedRoute>} />
          <Route path="/settings/opening-balance" element={<ProtectedRoute roles={[RoleCode.SOCIETY_ADMIN]}><OpeningBalanceEntry /></ProtectedRoute>} />
          <Route path="/setup" element={<ProtectedRoute roles={[RoleCode.SOCIETY_ADMIN]}><Setup /></ProtectedRoute>} />
          <Route path="/subscription/manage" element={<ProtectedRoute roles={[RoleCode.SOCIETY_ADMIN]}><SubscriptionManagement /></ProtectedRoute>} />
          <Route path="/subscription/renew" element={<Navigate to="/subscription/manage" replace />} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/payment-gateways" element={<PaymentGateways />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <NotFound />} />
        </Routes>
      </Suspense>
      {isAuthenticated && <MobileFAB />}
    </>
  );
}

export default function Router() {
  return (
    <Routes>
      {/* Admin panel — isolated with its own AdminAuthProvider and error boundary */}
      <Route path="/admin/*" element={<AdminApp />} />
      
      {/*
       * All society-facing routes — wrapped in AuthProvider so auth state is
       * available throughout the tree, and in ErrorBoundary to catch render errors.
       */}
      <Route
        path="/*"
        element={
          <ErrorBoundary variant="society">
            <AuthProvider>
              <UserRoutes />
            </AuthProvider>
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}
