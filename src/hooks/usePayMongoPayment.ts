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
      
      // Start status checking
      startStatusChecking(result.data.paymentIntentId);
      
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
  const checkPaymentStatus = useCallback(async (paymentIntentId: string): Promise<PayMongoPaymentStatus | null> => {
    try {
      setIsCheckingStatus(true);
      
      const response = await api.payments.getStatus(paymentIntentId);
      const result: PayMongoPaymentStatusResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to check payment status');
      }

      // Update payment intent status
      setPaymentIntent(prev => prev ? { ...prev, status: result.data.status } : null);

      return result.data.status;
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

      const response = await api.payments.cancel(paymentIntentId);
      const result: PayMongoCancelResponse = await response.json();

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
      setError(err instanceof Error ? err.message : 'Failed to cancel payment');
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
  const startStatusChecking = useCallback((paymentIntentId: string) => {
    // Clear any existing interval
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
    }

    // Check status every 3 seconds
    statusCheckInterval.current = setInterval(async () => {
      const status = await checkPaymentStatus(paymentIntentId);
      
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
