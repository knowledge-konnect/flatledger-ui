import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AdminRouter } from './AdminRouter';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

/**
 * AdminApp is the top-level wrapper for all /admin/* routes.
 * It injects the admin-specific auth context and then renders
 * the admin route tree. React Query and BrowserRouter are
 * provided by the parent App.tsx.
 */
export function AdminApp() {
  return (
    <ErrorBoundary variant="admin">
      <AdminAuthProvider>
        <AdminRouter />
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}
