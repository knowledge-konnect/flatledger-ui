import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { AdminLayout } from './components/AdminLayout';

// Lazy-load page components for code splitting
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminPlans = lazy(() => import('./pages/AdminPlans'));
const AdminSocieties = lazy(() => import('./pages/AdminSocieties'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminSubscriptions = lazy(() => import('./pages/AdminSubscriptions'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const AdminInvoices = lazy(() => import('./pages/AdminInvoices'));
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

            {/* Societies (read-only) */}
            <Route path="societies" element={<AdminSocieties />} />

            {/* Users (read-only) */}
            <Route path="users" element={<AdminUsers />} />

            {/* Subscriptions (read-only) */}
            <Route path="subscriptions" element={<AdminSubscriptions />} />

            {/* Payments (read-only) */}
            <Route path="payments" element={<AdminPayments />} />

            {/* Invoices (read-only) */}
            <Route path="invoices" element={<AdminInvoices />} />

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
