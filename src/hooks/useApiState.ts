// Enhanced API State Management Hook
// Provides loading states, error handling, and retry functionality for components

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiManager, enhancedApi } from '../utils/apiManager';

interface UseApiStateOptions {
  retryOnError?: boolean;
  autoRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  cacheKey?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface ApiState<T = any> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number;
  retryCount: number;
  isRetrying: boolean;
  isOffline: boolean;
  hasData: boolean;
}

export function useApiState<T = any>(
  apiCall: () => Promise<any>,
  options: UseApiStateOptions = {}
) {
  const {
    retryOnError = true,
    autoRetry = false,
    retryDelay = 1000,
    maxRetries = 3,
    cacheKey,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
    lastFetch: 0,
    retryCount: 0,
    isRetrying: false,
    isOffline: false,
    hasData: false,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const execute = useCallback(async (showLoading: boolean = true) => {
    if (!mountedRef.current) return;

    try {
      setState(prev => ({
        ...prev,
        isLoading: showLoading,
        error: null,
        isRetrying: false,
      }));

      const result = await apiCall();
      
      if (!mountedRef.current) return;

      if (result.success) {
        setState(prev => ({
          ...prev,
          data: result.data,
          isLoading: false,
          error: null,
          lastFetch: Date.now(),
          retryCount: 0,
          hasData: true,
          isOffline: false,
        }));

        onSuccess?.(result.data);
      } else {
        throw new Error(result.message || 'Request failed');
      }
    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isOffline: errorMessage.includes('Offline') || !navigator.onLine,
        retryCount: prev.retryCount + 1,
      }));

      onError?.(errorMessage);

      // Auto-retry logic
      if (retryOnError && state.retryCount < maxRetries && !state.isOffline) {
        if (autoRetry) {
          retryTimeoutRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, isRetrying: true }));
            execute(false);
          }, retryDelay * Math.pow(2, state.retryCount)); // Exponential backoff
        }
      }
    }
  }, [apiCall, retryOnError, autoRetry, retryDelay, maxRetries, state.retryCount, onSuccess, onError]);

  const retry = useCallback(() => {
    if (state.retryCount >= maxRetries) {
      setState(prev => ({ ...prev, retryCount: 0 }));
    }
    execute(true);
  }, [execute, state.retryCount, maxRetries]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
    execute(true);
  }, [execute]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearData = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: null,
      hasData: false,
      error: null,
    }));
  }, []);

  // Listen for API state changes
  useEffect(() => {
    const handleApiStateChange = (event: CustomEvent) => {
      const { key, state: apiState } = event.detail;
      if (cacheKey && key.includes(cacheKey)) {
        setState(prev => ({
          ...prev,
          isLoading: apiState.isLoading,
          error: apiState.error,
          lastFetch: apiState.lastFetch,
        }));
      }
    };

    window.addEventListener('api-state-change', handleApiStateChange as EventListener);
    return () => window.removeEventListener('api-state-change', handleApiStateChange as EventListener);
  }, [cacheKey]);

  // Listen for auth expiration
  useEffect(() => {
    const handleAuthExpired = () => {
      setState(prev => ({
        ...prev,
        error: 'Session expired - please login again',
        isLoading: false,
      }));
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      if (state.error?.includes('Offline')) {
        refresh();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh, state.error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute,
    retry,
    refresh,
    clearError,
    clearData,
  };
}

// Specialized hooks for common API patterns
export function useOrders(params?: any) {
  return useApiState(
    () => enhancedApi.orders.getAll(params),
    { 
      cacheKey: `orders:${JSON.stringify(params)}`,
      autoRetry: true,
      maxRetries: 5,
    }
  );
}

export function useMenuItems(params?: any) {
  return useApiState(
    () => enhancedApi.menus.getAll(params),
    { 
      cacheKey: `menus:${JSON.stringify(params)}`,
      autoRetry: true,
    }
  );
}

export function useInventory() {
  return useApiState(
    () => enhancedApi.inventory.getAllIngredients(),
    { 
      cacheKey: 'inventory',
      autoRetry: true,
      maxRetries: 5,
    }
  );
}

export function useDashboardStats() {
  return useApiState(
    () => enhancedApi.dashboard.getStats(),
    { 
      cacheKey: 'dashboard:stats',
      autoRetry: true,
      maxRetries: 3,
    }
  );
}

export function usePaymentMethods() {
  return useApiState(
    () => enhancedApi.payments.getAvailableMethods(),
    { 
      cacheKey: 'payment:methods',
      autoRetry: true,
    }
  );
}

// Optimistic update hook
export function useOptimisticUpdate<T>(
  apiCall: (data: T) => Promise<any>,
  optimisticData: T,
  rollbackData?: T
) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (data: T) => {
    setIsUpdating(true);
    setError(null);

    try {
      const result = await apiManager.optimisticUpdate(
        '/api/endpoint', // This should be dynamic based on the API call
        { method: 'POST', body: JSON.stringify(data) },
        optimisticData,
        rollbackData
      );

      if (!result.success) {
        throw new Error(result.message || 'Update failed');
      }

      setIsUpdating(false);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      setIsUpdating(false);
      throw err;
    }
  }, [optimisticData, rollbackData]);

  return {
    update,
    isUpdating,
    error,
    clearError: () => setError(null),
  };
}
