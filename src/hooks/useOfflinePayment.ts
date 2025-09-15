import { useState, useCallback, useEffect } from 'react';
import { api } from '../utils/api';
import { offlineApiManager } from '../utils/offlineApiManager';

export interface OfflinePaymentData {
  orderId: string;
  paymentMethod: 'cash' | 'gcash' | 'card' | 'paymongo';
  amount: number;
  notes?: string;
}

export interface OfflinePaymentResponse {
  success: boolean;
  data?: {
    paymentId: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    status: string;
    receiptNumber: string;
    timestamp: string;
  };
  message?: string;
}

export const useOfflinePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process payment (works both online and offline)
  const processPayment = useCallback(async (paymentData: OfflinePaymentData): Promise<OfflinePaymentResponse> => {
    try {
      setIsProcessing(true);
      setError(null);

      console.log('Processing payment:', paymentData);
      console.log('Online status:', isOnline);

      // Use offline API manager to route the request
      const response = await offlineApiManager.request('/api/offline-payments/process', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });

      const result: OfflinePaymentResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Payment processing failed');
      }

      console.log('Payment processed successfully:', result.data);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      console.error('Payment processing error:', errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, [isOnline]);

  // Get payment methods (works offline)
  const getPaymentMethods = useCallback(async () => {
    try {
      const response = await offlineApiManager.request('/api/offline-payments/methods');
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      return [];
    }
  }, []);

  // Get payment history for an order
  const getPaymentHistory = useCallback(async (orderId: string) => {
    try {
      const response = await offlineApiManager.request(`/api/offline-payments/order/${orderId}/history`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get payment history:', error);
      return [];
    }
  }, []);

  // Generate receipt
  const generateReceipt = useCallback(async (paymentId: string) => {
    try {
      const response = await offlineApiManager.request(`/api/offline-payments/receipt/${paymentId}`);
      
      if (response.ok) {
        // Return the receipt data or URL
        return await response.json();
      }
      throw new Error('Failed to generate receipt');
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      throw error;
    }
  }, []);

  // Get sync status
  const getSyncStatus = useCallback(async () => {
    try {
      const status = await offlineApiManager.getSyncStatus();
      setSyncStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }, []);

  // Force sync
  const forceSync = useCallback(async () => {
    try {
      const success = await offlineApiManager.forceSync();
      if (success) {
        await getSyncStatus(); // Refresh status
      }
      return success;
    } catch (error) {
      console.error('Force sync failed:', error);
      return false;
    }
  }, [getSyncStatus]);

  // Get offline status
  const getOfflineStatus = useCallback(() => {
    return offlineApiManager.getOfflineStatus();
  }, []);

  return {
    isProcessing,
    isOnline,
    error,
    syncStatus,
    processPayment,
    getPaymentMethods,
    getPaymentHistory,
    generateReceipt,
    getSyncStatus,
    forceSync,
    getOfflineStatus,
    setError
  };
};
