import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../api/adminAuthApi';
import {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  setAdminInitialized,
} from '../api/adminClient';
import type { AdminUser, AdminLoginRequest } from '../types/adminTypes';

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // On mount: only check /me if token exists, otherwise show login immediately
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setIsLoading(false);
      setAdminInitialized();
      return;
    }
    const init = async () => {
      try {
        const res = await adminAuthApi.me();
        setAdmin(res.data.data);
      } catch {
        clearAdminToken();
        setAdmin(null);
      } finally {
        setIsLoading(false);
        setAdminInitialized();
      }
    };
    init();
  }, []);

  const login = useCallback(async (credentials: AdminLoginRequest) => {
    const res = await adminAuthApi.login(credentials);
    const payload = res.data.data;
    setAdminToken(payload.accessToken);
    setAdmin({
      adminPublicId: payload.adminPublicId,
      name: payload.name,
      email: payload.email,
    });
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setAdmin(null);
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: admin !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
