import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import Router from './Router';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

/**
 * Global React Query client.
 * - refetchOnWindowFocus: disabled to avoid unexpected refetches when users switch tabs
 * - retry: 1 to handle transient network errors without hammering the server
 * - staleTime: 5 minutes — most data in this app changes infrequently
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Never retry client errors (4xx) — they indicate invalid input or auth issues,
      // not transient failures. Only retry once on network/5xx errors.
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404 || status === 422) return false;
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
}

function App() {
  return (
    <ErrorBoundary variant="society">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <ScrollToTop />
              <Router />
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
