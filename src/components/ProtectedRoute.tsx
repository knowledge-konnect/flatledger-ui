import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[]; // Optional roles - if provided, user must have at least one of these roles
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // 1. If authLoading is true: show loading spinner
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

  // 2. If not authenticated: redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/?reason=session_expired" replace />;
  }

  // 3. Support optional roles prop: If user.role not in allowed roles, redirect to /unauthorized
  if (roles && roles.length > 0) {
    // Check if user has at least one of the required roles
    const hasRequiredRole = user?.roles?.some(userRole => roles.includes(userRole)) || 
                           (user?.role && roles.includes(user.role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 4. Ensure no protected component renders before auth check completes
  // Auth check is complete at this point (isLoading = false, isAuthenticated = true, role check passed)
  return <>{children}</>;
};

export const RequireRole: React.FC<{
  children: React.ReactNode;
  roles: string[];
}> = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user || !roles.some(role => user.roles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
