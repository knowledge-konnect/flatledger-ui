import { useCallback } from 'react';
import { AxiosError } from 'axios';
import { useToast } from '../components/ui/Toast';
import {
  handleAxiosError,
  formatFieldErrors,
} from '../lib/apiResponseHandler';
import { ApiResult } from '../types/api';
import { logger } from '../lib/logger';

interface UseApiErrorHandlerOptions {
  showSuccess?: boolean;
  showFieldErrors?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (error: ApiResult<any>) => void;
}

/**
 * Custom hook for handling API responses with automatic toast notifications
 * Centralizes error/success message display logic
 */
export function useApiErrorHandler(options: UseApiErrorHandlerOptions = {}) {
  const { showToast } = useToast();
  const {
    showSuccess = true,
    showFieldErrors = true,
    onSuccess,
    onError,
  } = options;

  /**
   * Handle success response with optional toast
   */
  const handleSuccess = useCallback(
    <T,>(result: ApiResult<T>) => {
      if (showSuccess && result.message) {
        showToast(result.message, 'success');
      }
      onSuccess?.(result.message);
      return result;
    },
    [showSuccess, showToast, onSuccess]
  );

  /**
   * Handle error response with toast notifications
   */
  const handleError = useCallback(
    (error: ApiResult<any> | AxiosError<any>) => {
      let result: ApiResult<any>;

      // Convert AxiosError to ApiResult if needed
      if (error instanceof AxiosError) {
        result = handleAxiosError(error);
        logger.error(`[useApiErrorHandler] Axios error: ${error.message}`, { status: error.response?.status, url: error.config?.url });
      } else {
        result = error;
        logger.error(`[useApiErrorHandler] API error: ${result?.message || 'Unknown error'}`);
      }

      // Show validation field errors if present
      if (showFieldErrors && result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        const fieldErrorsText = formatFieldErrors(result.fieldErrors);
        if (fieldErrorsText) {
          showToast(fieldErrorsText, 'error');
        }
      }
      // Otherwise show main error message
      else if (result.message) {
        showToast(result.message, 'error');
      }

      onError?.(result);
      return result;
    },
    [showFieldErrors, showToast, onError]
  );

  /**
   * Handle API response (success or error)
   */
  const handle = useCallback(
    <T,>(result: ApiResult<T>) => {
      if (result.ok) {
        return handleSuccess(result);
      } else {
        return handleError(result);
      }
    },
    [handleSuccess, handleError]
  );

  /**
   * Wrap axios error with automatic toast
   */
  const handleAxiosErrorWithToast = useCallback(
    (error: AxiosError<any>) => {
      return handleError(error);
    },
    [handleError]
  );

  return {
    handleSuccess,
    handleError,
    handle,
    handleAxiosErrorWithToast,
  };
}

/**
 * Simpler hook for just showing error toasts
 */
export function useApiErrorToast() {
  const { showToast } = useToast();

  const showErrorToast = useCallback(
    (result: ApiResult<any>) => {
      // Show field errors first if present
      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        const fieldErrorsText = formatFieldErrors(result.fieldErrors);
        if (fieldErrorsText) {
          showToast(fieldErrorsText, 'error');
          return;
        }
      }

      // Show main message
      if (result.message) {
        showToast(result.message, 'error');
      }

    },
    [showToast]
  );

  const showSuccessToast = useCallback(
    (message: string) => {
      showToast(message, 'success');
    },
    [showToast]
  );

  return {
    showErrorToast,
    showSuccessToast,
  };
}
