import { useState, useCallback } from 'react';
import { api } from '../utils/api';
import { Discount } from '../types/discounts';

export const usePaymentManagement = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_status: 'unpaid' as 'unpaid' | 'paid' | 'refunded',
    payment_method: 'cash' as 'cash' | 'gcash' | 'card' | 'paymongo'
  });

  // Fetch available discounts
  const fetchAvailableDiscounts = useCallback(async () => {
    try {
      setIsLoadingDiscounts(true);
      setError(null);
      
      const response = await api.discounts.getAvailable();
      const result = await response.json();
      
      if (result.success && result.data) {
        setAvailableDiscounts(result.data);
        console.log('Available discounts fetched:', result.data);
      } else {
        setError(result.message || 'Failed to fetch available discounts');
      }
    } catch (err) {
      console.error('Error fetching available discounts:', err);
      setError('Failed to fetch available discounts. Please try again.');
    } finally {
      setIsLoadingDiscounts(false);
    }
  }, []);

  // Handle payment status update
  const handleUpdatePayment = useCallback(async (orderId: string, paymentData: any) => {
    try {
      setIsUpdatingPayment(true);
      setError(null);
      
      const response = await api.orders.updatePayment(orderId, paymentData);
      const result = await response.json();
      
      if (result.success && result.data) {
        setShowPaymentModal(false);
        console.log('Payment status updated:', result.data);
        return result.data;
      } else {
        setError(result.message || 'Failed to update payment status');
        return null;
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status. Please try again.');
      return null;
    } finally {
      setIsUpdatingPayment(false);
    }
  }, []);

  // Handle open payment modal
  const handleOpenPaymentModal = useCallback((order: any) => {
    setPaymentForm({
      payment_status: order.payment_status,
      payment_method: order.payment_method || 'cash'
    });
    setShowPaymentModal(true);
    fetchAvailableDiscounts();
  }, [fetchAvailableDiscounts]);

  // Handle close payment modal
  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setPaymentForm({
      payment_status: 'unpaid',
      payment_method: 'cash'
    });
  }, []);

  // Apply discount to order
  const applyDiscountToOrder = useCallback(async (orderId: string, discountCode: string) => {
    try {
      setIsApplyingDiscount(true);
      setError(null);

      const response = await api.discounts.applyToOrder(orderId, discountCode);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to apply discount');
      }

      console.log('Discount applied successfully:', result.data);
      return result.data;
    } catch (err) {
      console.error('Error applying discount:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply discount');
      return null;
    } finally {
      setIsApplyingDiscount(false);
    }
  }, []);

  return {
    showPaymentModal,
    setShowPaymentModal,
    availableDiscounts,
    isLoadingDiscounts,
    isUpdatingPayment,
    isApplyingDiscount,
    paymentForm,
    setPaymentForm,
    error,
    setError,
    fetchAvailableDiscounts,
    handleUpdatePayment,
    handleOpenPaymentModal,
    handleClosePaymentModal,
    applyDiscountToOrder
  };
};
