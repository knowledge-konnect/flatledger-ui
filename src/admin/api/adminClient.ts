import axios from 'axios';

const ADMIN_TOKEN_KEY = 'admin_token';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getAdminToken = (): string | null => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAdminToken = (token: string): void => {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore write errors (private browsing)
  }
};

export const clearAdminToken = (): void => {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
};

// ─── Flag to suppress interceptor redirect during initial auth check ──────────
let _adminInitialized = false;
export const setAdminInitialized = () => { _adminInitialized = true; };

// ─── Axios instance ───────────────────────────────────────────────────────────
export const adminClient = axios.create({
  // Use VITE_API_BASE_URL if set; fallback to proxy base (which proxies /api)
  baseURL: (import.meta.env.VITE_API_BASE_URL as string | undefined) || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Attach token on every request
adminClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && _adminInitialized) {
      clearAdminToken();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  },
);

// ─── Normalise error messages ─────────────────────────────────────────────────
export function getAdminErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
