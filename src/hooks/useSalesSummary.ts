import { useEffect, useState } from 'react';
import { directApiRequest, parseJsonResponse } from '../utils/api';

export interface DailySummaryFlexible {
  totalRevenue?: string | number;
  total_revenue?: string | number;
  netRevenue?: string | number;
  total_items_sold?: number;
  average_item_price?: string | number;
  orders_count?: number;
  top_item?: { name: string; quantity: number };
}

export const useSalesSummary = (date?: string) => {
  const [summary, setSummary] = useState<DailySummaryFlexible | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const d = date || new Date().toISOString().split('T')[0];
        const response = await directApiRequest(`/admin/sales/summary?date=${d}`, { method: 'GET' });

        if (!response.ok) {
          try {
            const errBody = await parseJsonResponse(response as Response);
            throw new Error(`API error: ${response.status} - ${JSON.stringify(errBody)}`);
          } catch (parseErr) {
            throw new Error(`API error: ${response.status} - ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
          }
        }

        const raw: any = await parseJsonResponse(response as Response);
        if (raw.success) {
          const s = raw.data || raw.summary || raw.totals || raw;
          setSummary(s as DailySummaryFlexible);
        } else {
          throw new Error('API returned success: false');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(message);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [date]);

  return { summary, isLoading, error };
};