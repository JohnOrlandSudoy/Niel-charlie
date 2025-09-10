import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Discount, ApiDiscountsResponse } from '../types/discounts';

interface UseAvailableDiscountsReturn {
  availableDiscounts: Discount[];
  isLoading: boolean;
  error: string | null;
  refreshAvailableDiscounts: () => Promise<void>;
  validateDiscountCode: (code: string, orderAmount?: number) => Promise<{
    isValid: boolean;
    discount?: Discount;
    discountAmount?: number;
    message?: string;
  }>;
}

export const useAvailableDiscounts = (): UseAvailableDiscountsReturn => {
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available discounts
  const fetchAvailableDiscounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.discounts.getAvailable();
      const result: ApiDiscountsResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch available discounts');
      }

      setAvailableDiscounts(result.data);
    } catch (err) {
      console.error('Error fetching available discounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch available discounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate discount code
  const validateDiscountCode = useCallback(async (code: string, orderAmount?: number) => {
    try {
      const response = await api.discounts.validate(code, orderAmount);
      const result = await response.json();

      if (!result.success) {
        return {
          isValid: false,
          message: result.message || 'Invalid discount code'
        };
      }

      return {
        isValid: true,
        discount: result.data.discount,
        discountAmount: result.data.discount_amount,
        message: result.message
      };
    } catch (err) {
      console.error('Error validating discount code:', err);
      return {
        isValid: false,
        message: err instanceof Error ? err.message : 'Failed to validate discount code'
      };
    }
  }, []);

  // Refresh function
  const refreshAvailableDiscounts = useCallback(() => fetchAvailableDiscounts(), [fetchAvailableDiscounts]);

  // Initial load
  useEffect(() => {
    fetchAvailableDiscounts();
  }, [fetchAvailableDiscounts]);

  return {
    availableDiscounts,
    isLoading,
    error,
    refreshAvailableDiscounts,
    validateDiscountCode,
  };
};
