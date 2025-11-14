import { useEffect, useState } from 'react';
import { directApiRequest, parseJsonResponse } from '../utils/api';

interface RevenuePoint {
  date: string;
  revenue: number;
  orders?: number;
}

interface RevenueAnalyticsData {
  totalRevenue: number;
  totalOrders?: number;
  points: RevenuePoint[];
  startDate: string;
  endDate: string;
}

interface BackendRevenueAnalytics {
  success: boolean;
  data?: {
    total_revenue?: string | number;
    totalRevenue?: string | number;
    total_orders?: number;
    totalOrders?: number;
    daily?: Array<{ date: string; revenue: string | number; orders?: number }>;
    points?: Array<{ date: string; revenue: string | number; orders?: number }>;
  };
  timeframe?: { start?: string; end?: string };
}

export const useRevenueAnalytics = (startDate?: string, endDate?: string) => {
  const [analytics, setAnalytics] = useState<RevenueAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const now = new Date();
        const end = endDate || now.toISOString().split('T')[0];
        const start = startDate || new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await directApiRequest(`/admin/sales/analytics/revenue?startDate=${start}&endDate=${end}`, { method: 'GET' });

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
          const summary = raw.summary || {};
          const totalRevenueRaw = summary.netRevenue ?? summary.totalRevenue ?? summary.total_revenue ?? 0;
          const byDate = raw.byDate || raw.daily || raw.points || {};
          const series = Array.isArray(byDate)
            ? byDate.map((p: any) => ({
                date: p.date,
                revenue: typeof p.revenue === 'string' ? parseFloat(p.revenue) : (p.net ? parseFloat(p.net) : Number(p.revenue || 0)),
                orders: p.orders,
              }))
            : Object.entries(byDate).map(([date, val]: [string, any]) => ({
                date,
                revenue: val && (val.net !== undefined ? parseFloat(val.net) : parseFloat(val.revenue || '0')),
                orders: (val as any)?.orders,
              }));

          setAnalytics({
            totalRevenue: typeof totalRevenueRaw === 'string' ? parseFloat(totalRevenueRaw) : Number(totalRevenueRaw),
            totalOrders: undefined,
            points: series,
            startDate: summary.startDate || start,
            endDate: summary.endDate || end,
          });
        } else {
          throw new Error('API returned success: false');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(message);
        setAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [startDate, endDate]);

  return { analytics, isLoading, error };
};