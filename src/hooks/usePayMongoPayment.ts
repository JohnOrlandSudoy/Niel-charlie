import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  PayMongoPaymentRequest, 
  PayMongoPaymentResponse, 
  PayMongoPaymentStatusResponse, 
  PayMongoCancelResponse,
  PayMongoPaymentIntent,
  PayMongoPaymentStatus,
  PayMongoPaymentUpdate
} from '../types/paymongo';
import { Order as ApiOrder } from '../types/orders';

export const usePayMongoPayment = () => {
  const [paymentIntent, setPaymentIntent] = useState<PayMongoPaymentIntent | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayMongoModal, setShowPayMongoModal] = useState(false);
  
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const currentOrder = useRef<ApiOrder | null>(null);

  // Create PayMongo payment intent
  const createPaymentIntent = useCallback(async (order: ApiOrder): Promise<PayMongoPaymentIntent | null> => {
    try {
      setIsCreatingPayment(true);
      setError(null);
      currentOrder.current = order;

      const paymentRequest: PayMongoPaymentRequest = {
        description: `Payment for Order #${order.order_number}`,
        metadata: {
          customer_phone: order.customer_phone || undefined,
          order_type: order.order_type
        }
      };

      const response = await api.orders.createPayMongoPayment(order.id, paymentRequest);
      const result: PayMongoPaymentResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to create PayMongo payment intent');
      }

      setPaymentIntent(result.data);
      setShowPayMongoModal(true);
      
      // Start status checking using order ID
      startStatusChecking(order.id);
      
      return result.data;
    } catch (err) {
      console.error('Error creating PayMongo payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment intent');
      return null;
    } finally {
      setIsCreatingPayment(false);
    }
  }, []);

  // Check payment status
  const checkPaymentStatus = useCallback(async (orderId: string): Promise<PayMongoPaymentStatus | null> => {
    try {
      setIsCheckingStatus(true);
      
      const response = await api.payments.getStatus(orderId);
      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to check payment status');
      }

      // Extract payment status from the comprehensive response
      const paymentStatus = result.data.paymongoStatus?.status || result.data.latestPayment?.status || null;
      
      if (paymentStatus && currentOrder.current) {
        // Update payment intent status
        setPaymentIntent(prev => prev ? { ...prev, status: paymentStatus } : null);
        return paymentStatus;
      }

      return null;
    } catch (err) {
      console.error('Error checking payment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check payment status');
      return null;
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  // Cancel payment
  const cancelPayment = useCallback(async (paymentIntentId: string): Promise<boolean> => {
    try {
      setIsCancelling(true);
      setError(null);

      console.log('Attempting to cancel payment:', paymentIntentId);

      // Enhanced error handling with detailed logging
      const response = await api.payments.cancel(paymentIntentId);
      
      console.log('Cancel payment response status:', response.status);
      console.log('Cancel payment response ok:', response.ok);
      console.log('Cancel payment response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = 'Could not read response text';
        }
        
        console.error('API response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: `/api/payments/cancel/${paymentIntentId}`
        });
        
        // Provide more specific error messages based on status code
        let errorMessage = '';
        switch (response.status) {
          case 404:
            errorMessage = 'Cancel payment endpoint not found. Please check if the backend API is running.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Permission denied. You may not have access to cancel payments.';
            break;
          default:
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      let result: PayMongoCancelResponse;
      try {
        result = await response.json();
        console.log('Cancel payment response:', result);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response format from server');
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to cancel payment');
      }

      // Update payment intent status
      setPaymentIntent(prev => prev ? { ...prev, status: 'cancelled' } : null);
      
      // Stop status checking
      stopStatusChecking();

      return true;
    } catch (err) {
      console.error('Error cancelling payment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel payment';
      
      // Check if it's a 404 error (endpoint not found)
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        console.warn('Cancel payment endpoint not found. Implementing local cancellation fallback.');
        
        // Local fallback: just update the UI state
        setPaymentIntent(prev => prev ? { ...prev, status: 'cancelled' } : null);
        stopStatusChecking();
        
        // Show a warning message
        setError('Payment cancelled locally (backend endpoint not available)');
        
        return true; // Return true for local cancellation
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, []);

  // Update order payment status
  const updateOrderPayment = useCallback(async (orderId: string, paymentData: PayMongoPaymentUpdate): Promise<boolean> => {
    try {
      setIsUpdatingOrder(true);
      setError(null);

      const response = await api.orders.updatePayment(orderId, paymentData);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update order payment');
      }

      return true;
    } catch (err) {
      console.error('Error updating order payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order payment');
      return false;
    } finally {
      setIsUpdatingOrder(false);
    }
  }, []);

  // Start automatic status checking
  const startStatusChecking = useCallback((orderId: string) => {
    // Clear any existing interval
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
    }

    // Check status every 3 seconds
    statusCheckInterval.current = setInterval(async () => {
      const status = await checkPaymentStatus(orderId);
      
      if (status === 'succeeded' && currentOrder.current) {
        // Payment succeeded, update order
        const success = await updateOrderPayment(currentOrder.current.id, {
          payment_status: 'paid',
          payment_method: 'paymongo'
        });
        
        if (success) {
          // Stop checking and close modal
          stopStatusChecking();
          setShowPayMongoModal(false);
          setPaymentIntent(null);
          currentOrder.current = null;
        }
      } else if (status === 'cancelled' || status === 'failed') {
        // Payment failed or cancelled, stop checking
        stopStatusChecking();
      }
    }, 3000);
  }, [checkPaymentStatus, updateOrderPayment]);

  // Stop status checking
  const stopStatusChecking = useCallback(() => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  }, []);

  // Close PayMongo modal
  const closePayMongoModal = useCallback(() => {
    setShowPayMongoModal(false);
    setPaymentIntent(null);
    stopStatusChecking();
    currentOrder.current = null;
  }, [stopStatusChecking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  return {
    paymentIntent,
    isCreatingPayment,
    isCheckingStatus,
    isCancelling,
    isUpdatingOrder,
    error,
    showPayMongoModal,
    createPaymentIntent,
    checkPaymentStatus,
    cancelPayment,
    updateOrderPayment,
    closePayMongoModal,
    setError
  };
};
