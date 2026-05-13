import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[]; // Optional roles - if provided, user must have at least one of these roles
}

/**
 * Component: ProtectedRoute
 * Purpose: Guards a route behind authentication and optional role checks.
 * Renders a loading spinner while auth state is resolving, redirects to the
 * landing page if unauthenticated, and to /unauthorized if the user lacks
 * the required role.
 *
 * Props:
 *   children: The protected page/component to render
 *   roles: Optional list of allowed role codes. If omitted, any authenticated user can access.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show a spinner while the auth state is being resolved (e.g. on page refresh)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to the landing page with a session-expired hint
  if (!isAuthenticated) {
    return <Navigate to="/?reason=session_expired" replace />;
  }

  // Role-based access control: check both the roles array and the legacy role string
  if (roles && roles.length > 0) {
    const hasRequiredRole = user?.roles?.some(userRole => roles.includes(userRole)) || 
                           (user?.role && roles.includes(user.role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Component: RequireRole
 * Purpose: Inline role guard for rendering UI elements conditionally.
 * Unlike ProtectedRoute (which guards full pages), this wraps smaller
 * sections that should only be visible to specific roles — e.g. hiding
 * a button for non-admins. Returns null (renders nothing) when the role
 * check fails so the rest of the page is unaffected.
 *
 * Props:
 *   children: Content to render if the role check passes
 *   roles: List of role codes that are allowed to see the children
 */
export const RequireRole: React.FC<{
  children: React.ReactNode;
  roles: string[];
}> = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user || !roles.some(role => user.roles?.includes(role) || user.role === role)) {
    return null;
  }

  return <>{children}</>;
};
