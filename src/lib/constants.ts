// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  FLATS: {
    LIST: '/flats',
    CREATE: '/flats',
    UPDATE: (id: string) => `/flats/${id}`,
    DELETE: (id: string) => `/flats/${id}`,
  },
  BILLING: {
    LIST: '/bills',
    CREATE: '/bills',
    UPDATE: (id: string) => `/bills/${id}`,
    DELETE: (id: string) => `/bills/${id}`,
  },
  PAYMENTS: {
    LIST: '/payments',
    CREATE: '/payments',
    UPDATE: (id: string) => `/payments/${id}`,
    DELETE: (id: string) => `/payments/${id}`,
  },
  EXPENSES: {
    LIST: '/expenses',
    CREATE: '/expenses',
    UPDATE: (id: string) => `/expenses/${id}`,
    DELETE: (id: string) => `/expenses/${id}`,
  },
};

// Status Constants
export const BILL_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  PARTIAL: 'partial',
} as const;

export const PAYMENT_MODES = {
  CASH: 'cash',
  UPI: 'upi',
  CHEQUE: 'cheque',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
} as const;

export const EXPENSE_CATEGORIES = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  SECURITY: 'security',
  REPAIRS: 'repairs',
  SALARY: 'salary',
  OTHERS: 'others',
} as const;

// Color Schemes
export const STATUS_COLORS = {
  success: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  info: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'dd MMM yyyy, hh:mm a',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE_REGEX: /^[0-9]{10}$/,
  MIN_PASSWORD_LENGTH: 8,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  USER: 'user',
  SOCIETY_ID: 'societyId',
  THEME: 'theme',
};
