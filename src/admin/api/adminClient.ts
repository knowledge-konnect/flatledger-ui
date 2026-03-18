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
// Always call Render directly — bypasses the Vite dev proxy so admin requests
// never get intercepted by the user-side proxy configuration.
const _adminBaseUrl = (import.meta.env.VITE_ADMIN_API_URL as string | undefined)?.replace(/\/+$/, '')
  || (import.meta.env.VITE_APP_API_URL as string | undefined)?.replace(/\/+$/, '')
  || '';

export const adminClient = axios.create({
  baseURL: _adminBaseUrl,
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
