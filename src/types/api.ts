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

export interface FieldError {
  field: string;
  messages: string[];
}

export interface ErrorResponse {
  code: string;
  message: string;
  errors?: FieldError[];
  traceId?: string;
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

