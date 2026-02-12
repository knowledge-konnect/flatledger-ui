import { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, ErrorResponse, ApiResult } from '../types/api';

/**
 * Unified API response handler that works with both fetch and axios
 * Normalizes success (2xx) and error (non-2xx) responses into a consistent format
 */
export async function handleApiResponse<T>(
  response: AxiosResponse<ApiResponse<T> | ErrorResponse> | Response
): Promise<ApiResult<T>> {
  // Handle fetch Response object
  if (response instanceof Response) {
    return handleFetchResponse<T>(response);
  }

  // Handle axios Response object
  return handleAxiosResponse<T>(response);
}

/**
 * Handle fetch Response
 */
async function handleFetchResponse<T>(response: Response): Promise<ApiResult<T>> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!isJson) {
    return {
      ok: false,
      message: `Invalid response content type: ${contentType}`,
      code: 'INVALID_CONTENT_TYPE',
    };
  }

  const body = await response.json();

  if (response.ok) {
    // Success response (2xx)
    const successBody = body as ApiResponse<T>;
    return {
      ok: true,
      message: successBody.message || 'Success',
      data: successBody.data,
    };
  }

  // Error response (non-2xx)
  const errorBody = body as ErrorResponse;
  const fieldErrors = errorBody.errors?.reduce(
    (acc, error) => {
      acc[error.field] = error.messages;
      return acc;
    },
    {} as Record<string, string[]>
  );

  return {
    ok: false,
    message: errorBody.message || 'An error occurred',
    code: errorBody.code,
    fieldErrors,
    traceId: errorBody.traceId,
  };
}

/**
 * Handle axios Response
 */
function handleAxiosResponse<T>(response: AxiosResponse<ApiResponse<T> | ErrorResponse>): ApiResult<T> {
  // Success response (2xx)
  if (response.status >= 200 && response.status < 300) {
    const successData = response.data as ApiResponse<T>;
    return {
      ok: true,
      message: successData.message || 'Success',
      data: successData.data,
    };
  }

  // Error response (non-2xx) - should not reach here normally with axios error handler
  const errorData = response.data as ErrorResponse;
  const fieldErrors = errorData.errors?.reduce(
    (acc, error) => {
      acc[error.field] = error.messages;
      return acc;
    },
    {} as Record<string, string[]>
  );

  return {
    ok: false,
    message: errorData.message || 'An error occurred',
    code: errorData.code,
    fieldErrors,
    traceId: errorData.traceId,
  };
}

/**
 * Handle axios error for use in catch blocks
 */
export function handleAxiosError<T>(error: AxiosError<ErrorResponse>): ApiResult<T> {
  if (!error.response) {
    // Network error or no response
    return {
      ok: false,
      message: error.message || 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      traceId: undefined,
    };
  }

  const errorData = error.response.data;
  const fieldErrors = errorData.errors?.reduce(
    (acc, error) => {
      acc[error.field] = error.messages;
      return acc;
    },
    {} as Record<string, string[]>
  );

  return {
    ok: false,
    message: errorData.message || 'An error occurred',
    code: errorData.code,
    fieldErrors,
    traceId: errorData.traceId,
  };
}

/**
 * Extract all error messages (both general and field-specific)
 * Useful for displaying comprehensive error information
 */
export function getErrorMessages(result: ApiResult<any>): string[] {
  const messages: string[] = [];

  // Add main message
  if (result.message) {
    messages.push(result.message);
  }

  // Add field-specific errors
  if (result.fieldErrors) {
    Object.entries(result.fieldErrors).forEach(([field, fieldMessages]) => {
      fieldMessages.forEach((msg) => {
        messages.push(`${field}: ${msg}`);
      });
    });
  }

  return messages;
}

/**
 * Format field errors for display
 * Returns a single string with all errors separated by newlines
 */
export function formatFieldErrors(fieldErrors?: Record<string, string[]>): string | null {
  if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
    return null;
  }

  const lines = Object.entries(fieldErrors)
    .flatMap(([field, messages]) => messages.map((msg) => `${field}: ${msg}`));

  return lines.join('\n');
}

/**
 * Extract first field error message for a specific field
 */
export function getFieldError(fieldErrors?: Record<string, string[]>, field?: string): string | null {
  if (!fieldErrors || !field) {
    return null;
  }

  const messages = fieldErrors[field];
  return messages && messages.length > 0 ? messages[0] : null;
}
