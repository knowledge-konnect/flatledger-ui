import { AxiosError } from 'axios';
import { ErrorResponse, FieldError } from '../types/api';

/**
 * Error Handler Utility
 * Provides centralized error handling following API documentation patterns
 * Maps HTTP status codes to user-friendly messages
 */

export interface ApiErrorInfo {
  type: 'validation' | 'bad_request' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'rate_limit' | 'server_error' | 'network' | 'unknown';
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

/**
 * Categorizes API errors based on HTTP status codes and error responses
 * Following the API documentation error handling patterns
 * 
 * @param error Unknown error (usually from catch block)
 * @returns ApiErrorInfo with categorized error details
 */
export function categorizeApiError(error: unknown): ApiErrorInfo {
  // Check if it's an Axios error with response
  if (isAxiosError(error) && error.response) {
    const { status, data } = error.response;
    const errorData = data as ErrorResponse;

    switch (status) {
      case 400:
        // Validation errors or bad request
        if (errorData.errors && errorData.errors.length > 0) {
          const validationErrors: Record<string, string[]> = {};
          errorData.errors.forEach((err: FieldError) => {
            validationErrors[err.field] = err.messages;
          });
          return {
            type: 'validation',
            message: errorData.message || 'Validation errors occurred',
            code: errorData.code,
            errors: validationErrors,
            traceId: errorData.traceId,
          };
        }
        return {
          type: 'bad_request',
          message: errorData.message || 'Invalid request',
          code: errorData.code,
          traceId: errorData.traceId,
        };

      case 401:
        return {
          type: 'unauthorized',
          message: errorData.message || 'Please log in again',
          code: errorData.code || 'UNAUTHORIZED',
          traceId: errorData.traceId,
        };

      case 403:
        return {
          type: 'forbidden',
          message: errorData.message || 'Insufficient permissions or subscription required',
          code: errorData.code || 'FORBIDDEN',
          traceId: errorData.traceId,
        };

      case 404:
        return {
          type: 'not_found',
          message: errorData.message || 'Resource not found',
          code: errorData.code || 'RESOURCE_NOT_FOUND',
          traceId: errorData.traceId,
        };

      case 409:
        return {
          type: 'conflict',
          message: errorData.message || 'Resource already exists',
          code: errorData.code || 'RESOURCE_CONFLICT',
          traceId: errorData.traceId,
        };

      case 429:
        return {
          type: 'rate_limit',
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          traceId: errorData.traceId,
        };

      case 500:
        return {
          type: 'server_error',
          message: 'An unexpected server error occurred. Please try again.',
          code: errorData.code || 'INTERNAL_SERVER_ERROR',
          traceId: errorData.traceId,
        };

      default:
        return {
          type: 'unknown',
          message: errorData.message || 'An error occurred',
          code: errorData.code,
          traceId: errorData.traceId,
        };
    }
  }

  // Network error (no response from server)
  if (isAxiosError(error) && error.request) {
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Type guard to check if error is an AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

/**
 * Formats validation errors for display in forms
 * Converts field-level errors to a string for easy display
 * 
 * @param errors Record of field names to error messages
 * @returns Record of field names to formatted error string
 */
export function formatValidationErrors(errors: Record<string, string[]>): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  Object.keys(errors).forEach(field => {
    formatted[field] = errors[field].join(', ');
  });
  
  return formatted;
}

/**
 * Gets a user-friendly error message for display
 * Includes field-level errors if present
 * 
 * @param errorInfo Categorized error information
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(errorInfo: ApiErrorInfo): string {
  if (errorInfo.type === 'validation' && errorInfo.errors) {
    const fieldErrors = Object.entries(errorInfo.errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    return `${errorInfo.message}\n${fieldErrors}`;
  }
  
  return errorInfo.message;
}

/**
 * Handles API errors and returns appropriate action
 * Can be used in catch blocks for consistent error handling
 * 
 * @param error Error from API call
 * @param onValidationError Optional callback for validation errors
 * @param onUnauthorized Optional callback for unauthorized errors
 * @returns ApiErrorInfo
 */
export function handleApiError(
  error: unknown,
  callbacks?: {
    onValidationError?: (errors: Record<string, string[]>) => void;
    onUnauthorized?: () => void;
    onForbidden?: () => void;
    onNotFound?: () => void;
  }
): ApiErrorInfo {
  const errorInfo = categorizeApiError(error);

  // Execute callbacks based on error type
  if (errorInfo.type === 'validation' && errorInfo.errors && callbacks?.onValidationError) {
    callbacks.onValidationError(errorInfo.errors);
  } else if (errorInfo.type === 'unauthorized' && callbacks?.onUnauthorized) {
    callbacks.onUnauthorized();
  } else if (errorInfo.type === 'forbidden' && callbacks?.onForbidden) {
    callbacks.onForbidden();
  } else if (errorInfo.type === 'not_found' && callbacks?.onNotFound) {
    callbacks.onNotFound();
  }

  return errorInfo;
}

/**
 * Creates a toast-friendly error message
 * Suitable for display in toast notifications
 * 
 * @param errorInfo Categorized error information
 * @returns Object with title and description for toast
 */
export function toToastError(errorInfo: ApiErrorInfo): { title: string; description: string } {
  const titles: Record<ApiErrorInfo['type'], string> = {
    validation: 'Validation Error',
    bad_request: 'Invalid Request',
    unauthorized: 'Unauthorized',
    forbidden: 'Access Denied',
    not_found: 'Not Found',
    conflict: 'Conflict',
    rate_limit: 'Too Many Requests',
    server_error: 'Server Error',
    network: 'Network Error',
    unknown: 'Error',
  };

  return {
    title: titles[errorInfo.type],
    description: getUserFriendlyMessage(errorInfo),
  };
}
