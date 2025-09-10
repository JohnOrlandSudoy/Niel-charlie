import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { 
  Discount, 
  CreateDiscountRequest, 
  UpdateDiscountRequest, 
  DiscountStats,
  ApiDiscountsResponse,
  ApiDiscountResponse,
  ApiDiscountStatsResponse
} from '../types/discounts';

interface UseDiscountManagementReturn {
  discounts: Discount[];
  stats: DiscountStats | null;
  isLoading: boolean;
  error: string | null;
  createDiscount: (data: CreateDiscountRequest) => Promise<boolean>;
  updateDiscount: (id: string, data: UpdateDiscountRequest) => Promise<boolean>;
  deleteDiscount: (id: string) => Promise<boolean>;
  toggleDiscountStatus: (id: string) => Promise<boolean>;
  refreshDiscounts: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useDiscountManagement = (): UseDiscountManagementReturn => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [stats, setStats] = useState<DiscountStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all discounts
  const fetchDiscounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Since the backend only has /available endpoint, we'll use that for all discounts
      const response = await api.discounts.getAll();
      const result: ApiDiscountsResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch discounts');
      }

      setDiscounts(result.data);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch discounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch discount statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.discounts.getStats();
      const result: ApiDiscountStatsResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch discount stats');
      }

      setStats(result.data);
    } catch (err) {
      console.error('Error fetching discount stats:', err);
      // Don't set error for stats as it's not critical
    }
  }, []);

  // Create new discount
  const createDiscount = useCallback(async (data: CreateDiscountRequest): Promise<boolean> => {
    try {
      setError(null);

      const response = await api.discounts.create(data);
      const result: ApiDiscountResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create discount');
      }

      // Refresh discounts list
      await fetchDiscounts();
      await fetchStats();

      return true;
    } catch (err) {
      console.error('Error creating discount:', err);
      setError(err instanceof Error ? err.message : 'Failed to create discount');
      return false;
    }
  }, [fetchDiscounts, fetchStats]);

  // Update discount
  const updateDiscount = useCallback(async (id: string, data: UpdateDiscountRequest): Promise<boolean> => {
    try {
      setError(null);

      const response = await api.discounts.update(id, data);
      const result: ApiDiscountResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update discount');
      }

      // Update local state
      setDiscounts(prev => prev.map(discount => 
        discount.id === id ? { ...discount, ...result.data } : discount
      ));

      await fetchStats();

      return true;
    } catch (err) {
      console.error('Error updating discount:', err);
      setError(err instanceof Error ? err.message : 'Failed to update discount');
      return false;
    }
  }, [fetchStats]);

  // Delete discount
  const deleteDiscount = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await api.discounts.delete(id);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete discount');
      }

      // Remove from local state
      setDiscounts(prev => prev.filter(discount => discount.id !== id));
      await fetchStats();

      return true;
    } catch (err) {
      console.error('Error deleting discount:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete discount');
      return false;
    }
  }, [fetchStats]);

  // Toggle discount status
  const toggleDiscountStatus = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await api.discounts.toggleStatus(id);
      const result: ApiDiscountResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to toggle discount status');
      }

      // Update local state
      setDiscounts(prev => prev.map(discount => 
        discount.id === id ? { ...discount, is_active: result.data.is_active } : discount
      ));

      await fetchStats();

      return true;
    } catch (err) {
      console.error('Error toggling discount status:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle discount status');
      return false;
    }
  }, [fetchStats]);

  // Refresh functions
  const refreshDiscounts = useCallback(() => fetchDiscounts(), [fetchDiscounts]);
  const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

  // Initial load
  useEffect(() => {
    fetchDiscounts();
    fetchStats();
  }, [fetchDiscounts, fetchStats]);

  return {
    discounts,
    stats,
    isLoading,
    error,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    toggleDiscountStatus,
    refreshDiscounts,
    refreshStats,
  };
};
