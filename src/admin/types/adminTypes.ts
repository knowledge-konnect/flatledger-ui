// ─── Generic API shapes ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  adminPublicId: string;
  name: string;
  email: string;
}

export interface AdminUser {
  adminPublicId: string;
  name: string;
  email: string;
}

// ─── Plans ────────────────────────────────────────────────────────────────────
export interface AdminPlanDto {
  id: string;
  name: string;
  monthlyAmount: number;
  currency: string;
  isActive: boolean;
  durationMonths: number;
  createdAt: string;
}

export interface AdminPlanCreateRequest {
  name: string;
  monthlyAmount: number;
  currency: string;
  durationMonths: number;
}

export interface AdminPlanUpdateRequest {
  name: string;
  monthlyAmount: number;
  currency: string;
  durationMonths: number;
  isActive?: boolean;
}

export type PlanListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean | '';
};

// ─── Societies ────────────────────────────────────────────────────────────────
export interface AdminSocietyDto {
  id: number;
  publicId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  currency: string;
  defaultMaintenanceCycle: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  onboardingDate: string | null;
}

export interface AdminSocietyUpdateRequest {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  currency: string;
  defaultMaintenanceCycle: 'monthly' | 'quarterly' | 'yearly';
  isDeleted?: boolean;
}

export type SocietyListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  isDeleted?: boolean | '';
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'cancelled' | 'trial' | 'expired';

export interface AdminSubscriptionDto {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  subscribedAmount: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionUpdateRequest {
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}

export type SubscriptionListParams = {
  page?: number;
  pageSize?: number;
  status?: SubscriptionStatus | '';
  userId?: number | '';
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export interface AdminPaymentDto {
  id: number;
  publicId: string;
  societyId: number;
  billId: number | null;
  flatId: number | null;
  amount: number;
  datePaid: string;
  modeCode: string;
  reference: string | null;
  paymentType: string;
  razorpayPaymentId: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export type PaymentListParams = {
  page?: number;
  pageSize?: number;
  societyId?: number | '';
  paymentType?: string;
  from?: string;
  to?: string;
};

// ─── Feature Flags ────────────────────────────────────────────────────────────
export interface FeatureFlagDto {
  id: number;
  key: string;
  description: string | null;
  isEnabled: boolean;
  societyId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagCreateRequest {
  key: string;
  description?: string;
  isEnabled: boolean;
  societyId?: number | null;
}

export interface FeatureFlagUpdateRequest {
  description?: string;
  isEnabled: boolean;
}

export type FeatureListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  societyId?: number | '';
};

// ─── Platform Settings ────────────────────────────────────────────────────────
export interface PlatformSettingDto {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettingUpsertRequest {
  key: string;
  value?: string | null;
  description?: string | null;
}

export type SettingListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};
