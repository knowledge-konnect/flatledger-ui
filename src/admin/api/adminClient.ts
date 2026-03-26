import axios from 'axios';
import { toast } from 'sonner';

// ─── Token helpers ────────────────────────────────────────────────────────────
// Access token stored in memory only — never in localStorage (XSS mitigation).
// Admin sessions do not persist across page refresh by design.
let _adminAccessToken: string | null = null;

export const getAdminToken = (): string | null => _adminAccessToken;

export const setAdminToken = (token: string): void => {
  _adminAccessToken = token;
};

export const clearAdminToken = (): void => {
  _adminAccessToken = null;
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

// Handle 401 / 429 responses
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 && _adminInitialized) {
      clearAdminToken();
      window.location.href = '/admin/login';
    }

    if (status === 429) {
      toast.error('Too many attempts. Please wait a minute and try again.');
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
