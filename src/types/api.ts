export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  succeeded: boolean;
  message: string;
  data: T;
}

/**
 * Standard error field structure from API documentation
 * Used in validation errors (400 Bad Request)
 */
export interface FieldError {
  field: string;
  messages: string[];
}

/**
 * Standard error response format from API documentation
 * All error responses follow this structure
 */
export interface ErrorResponse {
  code: string; // Error code: VALIDATION_FAILED, INVALID_CREDENTIALS, etc.
  message: string; // Human-readable error message
  errors?: FieldError[]; // Field-level validation errors
  traceId?: string; // Correlation ID for tracking
}

export interface ApiResult<T> {
  ok: boolean;
  message: string;
  data?: T;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  traceId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

