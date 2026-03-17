export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  societyName: string;
  societyAddress: string;
}

export interface AuthResponse {
  accessToken: string;
  roles: (string | { id?: number; code?: string; displayName?: string; name?: string })[];
  accessTokenExpiresAt?: string;
  // refreshToken and refreshTokenExpiresAt are no longer in the response body.
  // The backend sets refreshToken as an httpOnly cookie automatically.
  userPublicId?: string; // UUID format - primary identifier
  societyPublicId?: string; // UUID format
  societyId?: number; // Internal ID (not exposed in API)
  societyName?: string;
  userId?: number; // Internal ID (not exposed in API)
  userName?: string;
  email?: string;
  role?: string;
  roleDisplayName?: string;
  forcePasswordChange?: boolean;
}

export interface User {
  publicId: string; // UUID - primary identifier
  id: string; // Internal ID (for backward compatibility)
  email: string;
  name: string;
  userName?: string;
  role?: string;
  roles: string[];
  societyId: string; // Internal ID (for backward compatibility)
  societyPublicId: string; // UUID - primary identifier
  societyName?: string | null;
  forcePasswordChange?: boolean;
  isActive?: boolean;
  mobile?: string | null;
  roleDisplayName?: string;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
