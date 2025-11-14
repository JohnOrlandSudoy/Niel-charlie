-- Best Sellers Feature - Database Migration
-- Deploy to Supabase using SQL Editor
-- Estimated runtime: 2-3 minutes

-- ============================================================================
-- 1. MATERIALIZED VIEW: sales_metrics
-- ============================================================================
-- Aggregated best sellers data by week
CREATE MATERIALIZED VIEW public.sales_metrics AS
SELECT
  mi.id AS menu_item_id,
  mi.name AS menu_item_name,
  SUM(oi.quantity) AS total_quantity,
  SUM(oi.total_price) AS total_revenue,
  COUNT(DISTINCT oi.order_id) AS order_count,
  DATE_TRUNC('week', o.created_at)::date AS week_start,
  EXTRACT(WEEK FROM o.created_at)::int AS week_number,
  EXTRACT(YEAR FROM o.created_at)::int AS year,
  ROUND(SUM(oi.quantity)::numeric / 7, 2) AS average_daily_sales,
  MAX(o.created_at) AS last_updated
FROM public.order_items oi
JOIN public.menu_items mi ON oi.menu_item_id = mi.id
JOIN public.orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid' AND o.status = 'completed'
GROUP BY mi.id, mi.name, week_start, week_number, year
ORDER BY week_start DESC, total_quantity DESC;

-- Create indexes on materialized view
CREATE INDEX idx_sales_metrics_week_year 
  ON sales_metrics(week_number DESC, year DESC);
  
CREATE INDEX idx_sales_metrics_menu_item_id 
  ON sales_metrics(menu_item_id);
  
CREATE INDEX idx_sales_metrics_quantity 
  ON sales_metrics(total_quantity DESC);
  
CREATE INDEX idx_sales_metrics_revenue 
  ON sales_metrics(total_revenue DESC);

-- ============================================================================
-- 2. OPTIONAL: Table for daily snapshots (lightweight, fast queries)
-- ============================================================================
-- Uncomment to enable daily sales snapshots
/*
CREATE TABLE IF NOT EXISTS public.daily_sales_snapshot (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date date NOT NULL,
  menu_item_id uuid NOT NULL,
  total_quantity integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  order_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_sales_snapshot_menu_item_fkey 
    FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE
);

-- Unique constraint: One row per item per day
CREATE UNIQUE INDEX idx_daily_sales_unique 
  ON daily_sales_snapshot(sale_date, menu_item_id);

-- Indexes for fast queries
CREATE INDEX idx_daily_sales_date 
  ON daily_sales_snapshot(sale_date DESC);
  
CREATE INDEX idx_daily_sales_menu_item 
  ON daily_sales_snapshot(menu_item_id);
  
CREATE INDEX idx_daily_sales_revenue 
  ON daily_sales_snapshot(total_revenue DESC);
*/

-- ============================================================================
-- 3. ADDITIONAL INDEXES for better query performance
-- ============================================================================
-- Fast lookups on order_items by date
CREATE INDEX IF NOT EXISTS idx_order_items_created_at 
  ON public.order_items(created_at DESC);

-- Fast lookups by payment status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
  ON public.orders(payment_status, status);

-- Fast lookups by order date and status
CREATE INDEX IF NOT EXISTS idx_orders_created_status 
  ON public.orders(created_at DESC, status);

-- ============================================================================
-- 4. REFRESH STRATEGY
-- ============================================================================
-- Materialized views need manual refresh
-- Run this periodically (e.g., hourly via pg_cron or external task scheduler):
--
-- SELECT refresh_materialized_view('public.sales_metrics');
--
-- Or if using pg_cron extension (already in Supabase):
-- SELECT cron.schedule('refresh-sales-metrics', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.sales_metrics');

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - Optional, for extra security
-- ============================================================================
-- Enable RLS on sales_metrics view
ALTER TABLE public.sales_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all
CREATE POLICY "Admins can view all sales metrics"
  ON public.sales_metrics
  FOR SELECT
  USING (auth.jwt_meta()->>'role' = 'admin');

-- Policy: Managers can view all
CREATE POLICY "Managers can view all sales metrics"
  ON public.sales_metrics
  FOR SELECT
  USING (auth.jwt_meta()->>'role' = 'manager');

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================
-- Test materialized view
-- SELECT * FROM public.sales_metrics LIMIT 5;

-- Test best sellers for current week
-- SELECT 
--   RANK() OVER (ORDER BY total_quantity DESC) AS rank,
--   menu_item_id,
--   menu_item_name,
--   total_quantity,
--   total_revenue,
--   average_daily_sales
-- FROM public.sales_metrics
-- WHERE week_number = EXTRACT(WEEK FROM NOW())
--   AND year = EXTRACT(YEAR FROM NOW())
-- ORDER BY total_quantity DESC
-- LIMIT 10;

-- Test best sellers for specific week
-- SELECT 
--   RANK() OVER (ORDER BY total_quantity DESC) AS rank,
--   menu_item_id,
--   menu_item_name,
--   total_quantity,
--   total_revenue,
--   average_daily_sales
-- FROM public.sales_metrics
-- WHERE week_number = 45 AND year = 2025
-- ORDER BY total_quantity DESC
-- LIMIT 10;

-- ============================================================================
-- 7. DEPLOYMENT CHECKLIST
-- ============================================================================
-- After running migration:
-- [ ] Verify tables and views created (check Schema in Supabase)
-- [ ] Run verification queries (uncomment and test)
-- [ ] Verify indexes created (check Indexes in Supabase)
-- [ ] Test API endpoints in Postman/curl
-- [ ] Monitor database performance
-- [ ] Set up materialized view refresh schedule

-- ============================================================================
-- NOTES
-- ============================================================================
-- - Materialized views must be refreshed manually or via scheduled task
-- - Supabase provides pg_cron for scheduling: https://supabase.com/docs/guides/database/extensions/pgsql
-- - Consider refresh frequency based on business needs (hourly/daily)
-- - Daily snapshot table is optional but recommended for historical analytics
-- - All queries use payment_status='paid' AND status='completed' to exclude cancelled/pending orders
-- - Average daily sales = total quantity / 7 (assumes 7-day week)

