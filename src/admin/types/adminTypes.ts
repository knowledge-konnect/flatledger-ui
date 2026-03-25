// ─── Generic API shapes ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  succeeded: boolean;
  data: T;
  message?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
  publicId: string;
  name: string;
  email: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

// ─── Plans ────────────────────────────────────────────────────────────────────
export interface AdminPlanDto {
  id: string;
  name: string;
  monthlyAmount: number;
  currency: string;
  isActive?: boolean;
  durationMonths: number;
  createdAt?: string;
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
export interface AdminSocietySubscriptionSummary {
  id: string;
  planName: string;
  status: string;
  subscribedAmount: number;
  currency?: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
}

export interface AdminSocietyDto {
  id: number;
  publicId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  currency: string;
  defaultMaintenanceCycle: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  onboardingDate: string;
  flatCount: number;
  activeFlatCount: number;
  userCount: number;
  activeUserCount: number;
  activeSubscription?: AdminSocietySubscriptionSummary;
}

export type SocietyListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

// ─── Users ────────────────────────────────────────────────────────────────────
export interface AdminUserDto {
  id: number;
  publicId: string;
  societyId: number;
  societyName?: string;
  name: string;
  email?: string;
  mobile?: string;
  username?: string;
  roleId: number;
  isActive: boolean;
  isDeleted: boolean;
  lastLogin?: string;
  createdAt: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  trialEndsDate?: string;
  nextBillingDate?: string;
}

export type UserListParams = {
  page?: number;
  pageSize?: number;
  societyId?: number | '';
  search?: string;
  isActive?: boolean | '';
  isDeleted?: boolean | '';
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'cancelled' | 'trial' | 'expired' | 'past_due';

export interface AdminSubscriptionDto {
  id: string;
  userId: number;
  userName: string;
  userEmail?: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  subscribedAmount: number;
  currency?: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialStart?: string | null;
  trialEnd?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  billId?: number | null;
  flatId?: number | null;
  amount: number;
  datePaid?: string;
  modeCode?: string;
  reference?: string | null;
  paymentType?: string;
  razorpayPaymentId?: string | null;
  verifiedAt?: string | null;
  isDeleted: boolean;
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

// ─── Invoices ─────────────────────────────────────────────────────────────────
export interface AdminInvoiceDto {
  id: string;
  userId: number;
  userName?: string;
  subscriptionId?: string;
  invoiceNumber: string;
  invoiceType: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  currency?: string;
  status: string;
  periodStart?: string;
  periodEnd?: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt?: string;
}

export type InvoiceListParams = {
  page?: number;
  pageSize?: number;
  userId?: number | '';
  status?: string;
  invoiceType?: string;
  from?: string;
  to?: string;
};

// ─── Platform Settings ────────────────────────────────────────────────────────
export interface PlatformSettingDto {
  id: number;
  key: string;
  value?: string | null;
  description?: string | null;
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
