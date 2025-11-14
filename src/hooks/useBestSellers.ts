// src/hooks/useBestSellers.ts
import { useState, useEffect, useCallback } from 'react';
import { BestSellerItem, BestSellersResponse } from '../types/sales';
import { parseJsonResponse, directApiRequest } from '../utils/api';

export const useBestSellers = (limit: number = 10) => {
  const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState<number>(0);
  const [year, setYear] = useState<number>(0);

  const fetchBestSellers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await directApiRequest(`/admin/sales/best-sellers?limit=${limit}`, {
        method: 'GET'
      });

      if (!response.ok) {
        // Try to parse JSON error body if present
        try {
          const errBody = await parseJsonResponse(response as Response);
          throw new Error(`API error: ${response.status} - ${JSON.stringify(errBody)}`);
        } catch (parseErr) {
          throw new Error(`API error: ${response.status} - ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
        }
      }

      const data: BestSellersResponse = await parseJsonResponse(response as Response);
      
      if (data.success) {
        setBestSellers(data.data || []);
        setWeek(data.week);
        setYear(data.year);
      } else {
        throw new Error('API returned success: false');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      setBestSellers([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchBestSellers();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchBestSellers, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchBestSellers]);

  return { 
    bestSellers, 
    isLoading, 
    error, 
    week,
    year,
    refresh: fetchBestSellers 
  };
};
