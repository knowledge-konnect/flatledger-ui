import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { paymentApi, CreateOrderRequest } from '../api/paymentApi';
import { openRazorpayCheckout, RazorpayPaymentResponse } from '../lib/razorpay';

interface UseRazorpayPaymentState {
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;
}

interface UseRazorpayPaymentReturn extends UseRazorpayPaymentState {
  initiatePayment: (request: CreateOrderRequest) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for Razorpay payment integration
 * Handles order creation, payment modal, and verification
 */
export const useRazorpayPayment = (
  onPaymentSuccess: (subscriptionId: string) => void,
  onPaymentError?: (error: string) => void
): UseRazorpayPaymentReturn => {
  const { showToast } = useToast();
  const [state, setState] = useState<UseRazorpayPaymentState>({
    isLoading: false,
    error: null,
    isProcessing: false,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const initiatePayment = useCallback(
    async (request: CreateOrderRequest) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Step 1: Create Razorpay order from backend
        const orderResponse = await paymentApi.createOrder(request);

        if (!orderResponse.succeeded) {
          const errorMsg = `Failed to create payment order: ${orderResponse.error}`;
          setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
          showToast(errorMsg, 'error');
          onPaymentError?.(errorMsg);
          return;
        }

        // Step 2: Open Razorpay Checkout Modal
        setState(prev => ({ ...prev, isLoading: false, isProcessing: true }));

        await openRazorpayCheckout(
          {
            key: orderResponse.data.keyId,
            order_id: orderResponse.data.orderId,
            amount: orderResponse.data.amount,
            currency: orderResponse.data.currency,
            name: 'SocietyLedger',
            description: `Subscription Payment - ${request.planId}`,
            prefill: {
              email: '', // Will be populated from user context if available
              contact: '',
              name: '',
            },
            notes: {
              planId: request.planId,
            },
          },
          // Step 3: Handle successful payment
          async (response: RazorpayPaymentResponse) => {
            try {
              setState(prev => ({ ...prev, isProcessing: false, isLoading: true }));

              // Step 4: Verify payment with backend
              const verifyResponse = await paymentApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: request.planId,
              });

              if (verifyResponse.succeeded) {
                setState(prev => ({ ...prev, isLoading: false, error: null }));
                showToast('Payment successful! Subscription activated.', 'success');
                onPaymentSuccess(verifyResponse.data.subscriptionId);
              } else {
                const errorMsg = `Payment verification failed: ${verifyResponse.error}`;
                setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
                showToast(errorMsg, 'error');
                onPaymentError?.(errorMsg);
              }
            } catch (error) {
              const errorMsg = `Payment verification error: ${error instanceof Error ? error.message : 'Unknown error'}`;
              setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
              showToast(errorMsg, 'error');
              onPaymentError?.(errorMsg);
            }
          },
          // Step 5: Handle payment failure or cancellation
          (error: any) => {
            const errorMsg = error instanceof Error ? error.message : 'Payment cancelled or failed';
            setState(prev => ({ ...prev, isProcessing: false, isLoading: false, error: errorMsg }));
            showToast(errorMsg, 'error');
            onPaymentError?.(errorMsg);
          }
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An error occurred';
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
        showToast(errorMsg, 'error');
        onPaymentError?.(errorMsg);
      }
    },
    [onPaymentSuccess, onPaymentError]
  );

  return {
    ...state,
    initiatePayment,
    clearError,
  };
};