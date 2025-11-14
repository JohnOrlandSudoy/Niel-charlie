// src/hooks/useSalesRecords.ts
import { useState, useEffect } from 'react';
import { SalesRecord, SalesRecordsResponse } from '../types/sales';
import { parseJsonResponse, directApiRequest } from '../utils/api';

export interface UseSalesRecordsParams {
  page?: number;
  limit?: number;
  menuItemId?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'refunded';
  paymentMethod?: 'cash' | 'gcash' | 'card' | 'paymongo';
}

export const useSalesRecords = (params: UseSalesRecordsParams = {}) => {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ 
    page: 1, 
    total: 0, 
    pages: 1,
    limit: 50 
  });

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseParams: Record<string, string> = {
          page: (params.page || 1).toString(),
          limit: (params.limit || 50).toString(),
        };
        if (params.menuItemId) baseParams.menuItemId = params.menuItemId;
        if (params.paymentStatus) baseParams.paymentStatus = params.paymentStatus;
        if (params.paymentMethod) baseParams.paymentMethod = params.paymentMethod;
        if (params.startDate) baseParams.startDate = params.startDate;
        if (params.endDate) baseParams.endDate = params.endDate;

        const searchParams = new URLSearchParams(baseParams);

        const useRangeEndpoint = !!(params.startDate && params.endDate);
        const endpoint = useRangeEndpoint
          ? `/admin/sales/records/range?${searchParams.toString()}`
          : `/admin/sales/records?${searchParams.toString()}`;

        const response = await directApiRequest(endpoint, { method: 'GET' });

        if (!response.ok) {
          try {
            const errBody = await parseJsonResponse(response as Response);
            throw new Error(`API error: ${response.status} - ${JSON.stringify(errBody)}`);
          } catch (parseErr) {
            throw new Error(`API error: ${response.status} - ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
          }
        }

        const data: SalesRecordsResponse = await parseJsonResponse(response as Response);
        
        if (data.success) {
          setRecords(data.data || []);
          setPagination(data.pagination);
        } else {
          throw new Error('API returned success: false');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(message);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [
    params.page,
    params.limit,
    params.menuItemId,
    params.startDate,
    params.endDate,
    params.paymentStatus,
    params.paymentMethod,
  ]);

  return { 
    records, 
    isLoading, 
    error, 
    pagination 
  };
};
