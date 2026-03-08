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
  initiatePayment: (planId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for Razorpay payment integration
 * Handles order creation, payment modal, and verification
 */
export const useRazorpayPayment = (
  onPaymentSuccess: () => void,
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
    async (planId: string) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        // Step 1: Create Razorpay order from backend (send only planId)
        const orderResponse = await paymentApi.createOrder({ planId });
        setState(prev => ({ ...prev, isLoading: false, isProcessing: true }));

        // Step 2: Open Razorpay Checkout Modal
        await openRazorpayCheckout(
          {
            key: orderResponse.keyId,
            order_id: orderResponse.orderId,
            amount: orderResponse.amount * 100, // Razorpay expects paise
            currency: orderResponse.currency,
            name: 'Society Ledger',
            description: 'Subscription Payment',
            notes: { planId },
          },
          // Step 3: Handle successful payment
          async (paymentResult: RazorpayPaymentResponse) => {
            try {
              setState(prev => ({ ...prev, isProcessing: false, isLoading: true }));
              // Step 4: Verify payment with backend
              const verifyResponse = await paymentApi.verifyPayment({
                orderId: paymentResult.razorpay_order_id,
                paymentId: paymentResult.razorpay_payment_id,
                signature: paymentResult.razorpay_signature,
              });
              setState(prev => ({ ...prev, isLoading: false }));
              if (verifyResponse.isValid) {
                showToast('Payment successful! Subscription activated.', 'success');
                onPaymentSuccess();
              } else {
                setState(prev => ({ ...prev, error: 'Payment failed. Please try again.' }));
                showToast('Payment failed. Please try again.', 'error');
                onPaymentError?.('Payment failed. Please try again.');
              }
            } catch (error) {
              setState(prev => ({ ...prev, isLoading: false, error: 'Something went wrong. Please contact support.' }));
              showToast('Something went wrong. Please contact support.', 'error');
              onPaymentError?.('Something went wrong. Please contact support.');
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
        setState(prev => ({ ...prev, isLoading: false, error: 'Something went wrong. Please contact support.' }));
        showToast('Something went wrong. Please contact support.', 'error');
        onPaymentError?.('Something went wrong. Please contact support.');
      }
    },
    [onPaymentSuccess, onPaymentError, showToast]
  );

  return {
    ...state,
    initiatePayment,
    clearError,
  };
};