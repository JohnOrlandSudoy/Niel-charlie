// src/hooks/useSalesRecords.ts
import { useState, useEffect } from 'react';
import { SalesRecord, SalesRecordsResponse } from '../types/sales';
import { parseJsonResponse } from '../utils/api';

export interface UseSalesRecordsParams {
  page?: number;
  limit?: number;
  menu_item_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: string;
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

        const searchParams = new URLSearchParams({
          page: (params.page || 1).toString(),
          limit: (params.limit || 50).toString(),
          ...(params.menu_item_id && { menu_item_id: params.menu_item_id }),
          ...(params.start_date && { start_date: params.start_date }),
          ...(params.end_date && { end_date: params.end_date }),
          ...(params.sort_by && { sort_by: params.sort_by }),
          ...(params.sort_order && { sort_order: params.sort_order })
        });

        const response = await fetch(
          `/api/admin/sales/records?${searchParams.toString()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            }
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
    params.menu_item_id, 
    params.start_date, 
    params.end_date,
    params.sort_by,
    params.sort_order
  ]);

  return { 
    records, 
    isLoading, 
    error, 
    pagination 
  };
};
