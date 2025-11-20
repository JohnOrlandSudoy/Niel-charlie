// src/hooks/useBestSellersByWeek.ts
import { useState, useEffect } from 'react';
import { BestSellerItem, BestSellersResponse } from '../types/sales';
import { parseJsonResponse, directApiRequest } from '../utils/api';

export const useBestSellersByWeek = (week: number, year: number, limit: number = 10) => {
  const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          week: week.toString(),
          year: year.toString(),
          limit: limit.toString(),
          offset: ((currentPage - 1) * limit).toString()
        });

        const response = await directApiRequest(
          `/api/admin/sales/best-sellers/week?${params.toString()}`,
          {
            method: 'GET'
          }
        );

        if (!response.ok) {
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
          setTotal(data.total_records || 0);
          setPages(data.page_info?.total || 1);
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
    };

    fetchBestSellers();
  }, [week, year, limit, currentPage]);

  return { 
    bestSellers, 
    isLoading, 
    error, 
    total, 
    pages, 
    currentPage, 
    setPage: setCurrentPage 
  };
};
