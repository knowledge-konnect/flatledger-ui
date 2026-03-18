import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { AdminLayout } from './components/AdminLayout';

// Lazy-load page components for code splitting
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminPlans = lazy(() => import('./pages/AdminPlans'));
const AdminPlanForm = lazy(() => import('./pages/AdminPlanForm'));
const AdminSocieties = lazy(() => import('./pages/AdminSocieties'));
const AdminSocietyEdit = lazy(() => import('./pages/AdminSocietyEdit'));
const AdminSubscriptions = lazy(() => import('./pages/AdminSubscriptions'));
const AdminSubscriptionEdit = lazy(() => import('./pages/AdminSubscriptionEdit'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const AdminPaymentDetail = lazy(() => import('./pages/AdminPaymentDetail'));
const AdminFeatureFlags = lazy(() => import('./pages/AdminFeatureFlags'));
const AdminFeatureFlagForm = lazy(() => import('./pages/AdminFeatureFlagForm'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

function AdminPageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-indigo-500" />
    </div>
  );
}

export function AdminRouter() {
  return (
    <Suspense fallback={<AdminPageLoader />}>
      <Routes>
        {/* Public admin route */}
        <Route path="login" element={<AdminLogin />} />

        {/* Protected admin routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* Plans */}
            <Route path="plans" element={<AdminPlans />} />
            <Route path="plans/new" element={<AdminPlanForm />} />
            <Route path="plans/:id/edit" element={<AdminPlanForm />} />

            {/* Societies */}
            <Route path="societies" element={<AdminSocieties />} />
            <Route path="societies/:id/edit" element={<AdminSocietyEdit />} />

            {/* Subscriptions */}
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="subscriptions/:id/edit" element={<AdminSubscriptionEdit />} />

            {/* Payments (read-only) */}
            <Route path="payments" element={<AdminPayments />} />
            <Route path="payments/:id" element={<AdminPaymentDetail />} />

            {/* Feature Flags */}
            <Route path="features" element={<AdminFeatureFlags />} />
            <Route path="features/new" element={<AdminFeatureFlagForm />} />
            <Route path="features/:id/edit" element={<AdminFeatureFlagForm />} />

            {/* Platform Settings */}
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Suspense>
  );
}
