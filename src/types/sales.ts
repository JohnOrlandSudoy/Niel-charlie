// src/types/sales.ts
// Type definitions for Best Sellers feature

export interface BestSellerItem {
  rank: number;
  menu_item_id: string;
  menu_item_name: string;
  total_quantity: number;
  total_revenue: string; // Decimal as string
  average_daily_sales: string;
  growth_percentage?: number;
  last_week_quantity?: number;
}

export interface BestSellersResponse {
  success: boolean;
  data: BestSellerItem[];
  week: number;
  year: number;
  total_records: number;
  page_info: {
    current: number;
    total: number;
    limit: number;
  };
}

export interface SalesRecord {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  order_id: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  order_date: string; // ISO 8601
  order_type: 'dine_in' | 'takeout';
  payment_status: 'paid' | 'unpaid' | 'refunded';
  quantity_sold_that_day: number;
}

export interface SalesRecordsResponse {
  success: boolean;
  data: SalesRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  summary: {
    total_quantity: number;
    total_revenue: string;
    date_range: {
      start: string;
      end: string;
    };
  };
}

export interface SalesSummary {
  total_items_sold: number;
  total_revenue: string;
  average_item_price: string;
  top_item: {
    name: string;
    quantity: number;
  };
  item_count: number;
  orders_count: number;
}

export interface SalesSummaryResponse {
  success: boolean;
  data: SalesSummary;
  timeframe: string;
}
