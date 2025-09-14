import { useState, useEffect } from 'react';
import { api } from '../utils/api';

// Payment Method Types (same as in Settings.tsx)
export interface PaymentMethod {
  id: string;
  method_key: string;
  method_name: string;
  method_description: string;
  is_enabled: boolean;
  is_online: boolean;
  requires_setup: boolean;
  display_order: number;
  icon_name: string;
  color_code: string;
  config_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsePaymentMethodsReturn {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePaymentMethods = (): UsePaymentMethodsReturn => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.payments.getAvailableMethods();
      const result = await response.json();
      
      if (result.success && result.data) {
        // The API already returns only available/enabled methods, so use them directly
        setPaymentMethods(result.data);
      } else {
        setError(result.message || 'Failed to fetch payment methods');
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to fetch payment methods');
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return {
    paymentMethods,
    loading,
    error,
    refetch: fetchPaymentMethods
  };
};
