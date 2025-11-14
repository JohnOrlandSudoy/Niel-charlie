# Best Sellers Feature - Complete Implementation Plan

**Date:** November 14, 2025  
**Status:** Design & Planning  
**Priority:** HIGH  
**Estimated Effort:** 16-20 hours

---

## 1. Feature Overview

### Purpose
Add comprehensive sales analytics to the dashboard showing:
- 🏆 Best-selling menu items (ranked)
- 📊 Historical best sellers by week/year
- 📈 Sales performance trends
- 💰 Revenue & quantity metrics per item
- 📋 Paginated sales records for detailed analysis

### Business Value
- Identify top-performing menu items
- Data-driven pricing & promotion decisions
- Understand seasonal sales trends
- Inventory planning based on top sellers

### User Roles
- **Admin:** View all best sellers, export data
- **Manager:** View best sellers, analyze trends
- **Kitchen:** View top items (read-only)

---

## 2. API Endpoints Specification

### Endpoint 1: Current Week Best Sellers
```
GET /api/admin/sales/best-sellers
```

**Purpose:** Get top 10 best-selling items for current week

**Query Parameters:**
```
limit (optional): number = 10 (default: 10, max: 50)
offset (optional): number = 0
```

**Request Example:**
```bash
curl -H "Authorization: Bearer <ADMIN_JWT>" \
  "http://localhost:3000/api/admin/sales/best-sellers?limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "menu_item_id": "uuid",
      "menu_item_name": "Fried Chicken (Regular)",
      "total_quantity": 120,
      "total_revenue": "6000.00",
      "average_daily_sales": "17.14",
      "growth_percentage": 15.5,
      "last_week_quantity": 104
    }
  ],
  "week": 46,
  "year": 2025,
  "total_records": 127,
  "page_info": {
    "current": 1,
    "total": 13,
    "limit": 10
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid JWT
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Database error

---

### Endpoint 2: Best Sellers by Week/Year
```
GET /api/admin/sales/best-sellers/week
```

**Purpose:** Get best sellers for specific week and year

**Query Parameters:**
```
week: number (1-53, required) — ISO week number
year: number (required) — Calendar year (e.g., 2025)
limit (optional): number = 10
offset (optional): number = 0
```

**Request Example:**
```bash
curl -H "Authorization: Bearer <ADMIN_JWT>" \
  "http://localhost:3000/api/admin/sales/best-sellers/week?week=45&year=2025&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "menu_item_id": "uuid",
      "menu_item_name": "Spicy Sisig",
      "total_quantity": 78,
      "total_revenue": "4680.00",
      "average_daily_sales": "11.14",
      "growth_percentage": 8.2,
      "last_week_quantity": 72
    }
  ],
  "week": 45,
  "year": 2025,
  "total_records": 98,
  "page_info": {
    "current": 1,
    "total": 10,
    "limit": 10
  }
}
```

---

### Endpoint 3: Paginated Sales Records
```
GET /api/admin/sales/records
```

**Purpose:** Get detailed sales records with pagination and filtering

**Query Parameters:**
```
page: number = 1
limit: number = 50 (max: 100)
menu_item_id (optional): uuid filter
start_date (optional): ISO date (YYYY-MM-DD)
end_date (optional): ISO date (YYYY-MM-DD)
sort_by (optional): 'quantity' | 'revenue' | 'date' = 'date'
sort_order (optional): 'asc' | 'desc' = 'desc'
```

**Request Example:**
```bash
curl -H "Authorization: Bearer <ADMIN_JWT>" \
  "http://localhost:3000/api/admin/sales/records?page=1&limit=50"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "menu_item_id": "uuid",
      "menu_item_name": "Fried Chicken (Regular)",
      "order_id": "uuid",
      "quantity": 2,
      "unit_price": "50.00",
      "total_price": "100.00",
      "order_date": "2025-11-14T10:30:00Z",
      "order_type": "dine_in",
      "payment_status": "paid",
      "quantity_sold_that_day": 45
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5234,
    "pages": 105,
    "has_next": true,
    "has_prev": false
  },
  "summary": {
    "total_quantity": 5234,
    "total_revenue": "261700.00",
    "date_range": {
      "start": "2025-11-14",
      "end": "2025-11-14"
    }
  }
}
```

---

### Endpoint 4: Sales Summary (Bonus)
```
GET /api/admin/sales/summary
```

**Purpose:** Quick KPIs for dashboard cards

**Query Parameters:**
```
timeframe (optional): 'day' | 'week' | 'month' = 'week'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_items_sold": 1250,
    "total_revenue": "62500.00",
    "average_item_price": "50.00",
    "top_item": {
      "name": "Fried Chicken",
      "quantity": 120
    },
    "item_count": 45,
    "orders_count": 320
  },
  "timeframe": "week"
}
```

---

## 3. Database Schema Requirements

### Table: sales_metrics (NEW)
Materialized view for aggregated best sellers data

```sql
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
  o.created_at
FROM public.order_items oi
JOIN public.menu_items mi ON oi.menu_item_id = mi.id
JOIN public.orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid' AND o.status = 'completed'
GROUP BY mi.id, mi.name, week_start, week_number, year
ORDER BY week_start DESC, total_quantity DESC;

CREATE INDEX idx_sales_metrics_week_year 
  ON sales_metrics(week_number, year);
CREATE INDEX idx_sales_metrics_menu_item_id 
  ON sales_metrics(menu_item_id);
```

### Table: daily_sales_snapshot (NEW - Optional)
```sql
CREATE TABLE public.daily_sales_snapshot (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date date NOT NULL UNIQUE,
  menu_item_id uuid NOT NULL,
  total_quantity integer,
  total_revenue numeric,
  order_count integer,
  created_at timestamp DEFAULT now(),
  CONSTRAINT daily_sales_snapshot_menu_item_fkey 
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE INDEX idx_daily_sales_date ON daily_sales_snapshot(sale_date);
```

### Indexes to Add
```sql
-- For fast queries on sales_metrics
CREATE INDEX idx_sales_metrics_quantity 
  ON sales_metrics(total_quantity DESC);
CREATE INDEX idx_sales_metrics_revenue 
  ON sales_metrics(total_revenue DESC);

-- For fast order_items queries
CREATE INDEX idx_order_items_created_at 
  ON order_items(created_at DESC);
```

---

## 4. Type Definitions

### TypeScript Types
```typescript
// types/sales.ts

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
```

---

## 5. Backend Implementation (Node.js/Express)

### File: `routes/admin/sales.ts`

```typescript
import express from 'express';
import { Router } from 'express';
import { verifyAdminToken } from '../../middleware/auth';
import { SalesController } from '../../controllers/SalesController';

const router = Router();
const salesController = new SalesController();

// Middleware: All routes require admin auth
router.use(verifyAdminToken);

// Best sellers endpoints
router.get('/best-sellers', 
  salesController.getBestSellers.bind(salesController)
);

router.get('/best-sellers/week', 
  salesController.getBestSellersByWeek.bind(salesController)
);

// Sales records endpoint
router.get('/records', 
  salesController.getSalesRecords.bind(salesController)
);

// Sales summary endpoint
router.get('/summary', 
  salesController.getSalesSummary.bind(salesController)
);

export default router;
```

### File: `controllers/SalesController.ts`

```typescript
import { Request, Response } from 'express';
import { SalesService } from '../services/SalesService';
import { getCurrentWeek, getCurrentYear } from '../utils/dateUtils';

export class SalesController {
  private salesService = new SalesService();

  async getBestSellers(req: Request, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const offset = parseInt(req.query.offset as string) || 0;

      const currentWeek = getCurrentWeek();
      const currentYear = getCurrentYear();

      const result = await this.salesService.getBestSellersByWeek(
        currentWeek,
        currentYear,
        limit,
        offset
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch best sellers' 
      });
    }
  }

  async getBestSellersByWeek(req: Request, res: Response) {
    try {
      const week = parseInt(req.query.week as string);
      const year = parseInt(req.query.year as string);
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate inputs
      if (!week || week < 1 || week > 53) {
        return res.status(400).json({ 
          success: false, 
          error: 'Week must be between 1 and 53' 
        });
      }
      if (!year || year < 2020) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid year' 
        });
      }

      const result = await this.salesService.getBestSellersByWeek(
        week,
        year,
        limit,
        offset
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching best sellers by week:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch best sellers' 
      });
    }
  }

  async getSalesRecords(req: Request, res: Response) {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const menuItemId = req.query.menu_item_id as string | undefined;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;
      const sortBy = (req.query.sort_by as string) || 'date';
      const sortOrder = (req.query.sort_order as string) || 'desc';

      const result = await this.salesService.getSalesRecords({
        page,
        limit,
        menuItemId,
        startDate,
        endDate,
        sortBy,
        sortOrder
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching sales records:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch sales records' 
      });
    }
  }

  async getSalesSummary(req: Request, res: Response) {
    try {
      const timeframe = (req.query.timeframe as string) || 'week';

      const result = await this.salesService.getSalesSummary(timeframe);

      res.json(result);
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch sales summary' 
      });
    }
  }
}
```

### File: `services/SalesService.ts`

```typescript
import { supabase } from '../lib/supabase';
import { BestSellersResponse, SalesRecordsResponse, SalesSummaryResponse } from '../types/sales';
import { getCurrentWeek, getCurrentYear } from '../utils/dateUtils';

export class SalesService {
  
  async getBestSellersByWeek(
    week: number,
    year: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<BestSellersResponse> {
    // Query sales_metrics materialized view
    const { data, count, error } = await supabase
      .from('sales_metrics')
      .select('*', { count: 'exact' })
      .eq('week_number', week)
      .eq('year', year)
      .order('total_quantity', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Add rankings
    const rankedData = (data || []).map((item: any, index: number) => ({
      rank: offset + index + 1,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_item_name,
      total_quantity: item.total_quantity,
      total_revenue: item.total_revenue?.toString() || '0',
      average_daily_sales: item.average_daily_sales?.toString() || '0'
    }));

    return {
      success: true,
      data: rankedData,
      week,
      year,
      total_records: count || 0,
      page_info: {
        current: Math.floor(offset / limit) + 1,
        total: Math.ceil((count || 0) / limit),
        limit
      }
    };
  }

  async getSalesRecords(params: {
    page: number;
    limit: number;
    menuItemId?: string;
    startDate?: string;
    endDate?: string;
    sortBy: string;
    sortOrder: string;
  }): Promise<SalesRecordsResponse> {
    let query = supabase
      .from('order_items')
      .select(`
        id,
        menu_item_id,
        menu_items(name),
        order_id,
        quantity,
        unit_price,
        total_price,
        orders(created_at, order_type, payment_status)
      `, { count: 'exact' })
      .eq('orders.payment_status', 'paid')
      .eq('orders.status', 'completed');

    // Apply filters
    if (params.menuItemId) {
      query = query.eq('menu_item_id', params.menuItemId);
    }

    if (params.startDate) {
      query = query.gte('orders.created_at', `${params.startDate}T00:00:00`);
    }

    if (params.endDate) {
      query = query.lte('orders.created_at', `${params.endDate}T23:59:59`);
    }

    // Sort
    const sortColumn = params.sortBy === 'revenue' ? 'total_price' : 
                      params.sortBy === 'quantity' ? 'quantity' : 
                      'orders.created_at';
    query = query.order(sortColumn, { ascending: params.sortOrder === 'asc' });

    // Paginate
    const offset = (params.page - 1) * params.limit;
    const { data, count, error } = await query.range(offset, offset + params.limit - 1);

    if (error) throw error;

    // Format response
    const formatted = (data || []).map((item: any) => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_items?.name,
      order_id: item.order_id,
      quantity: item.quantity,
      unit_price: item.unit_price?.toString() || '0',
      total_price: item.total_price?.toString() || '0',
      order_date: item.orders?.created_at,
      order_type: item.orders?.order_type,
      payment_status: item.orders?.payment_status
    }));

    return {
      success: true,
      data: formatted,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / params.limit),
        has_next: offset + params.limit < (count || 0),
        has_prev: params.page > 1
      },
      summary: {
        total_quantity: formatted.reduce((sum, r) => sum + r.quantity, 0),
        total_revenue: formatted.reduce((sum, r) => sum + parseFloat(r.total_price), 0).toString(),
        date_range: {
          start: formatted[0]?.order_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          end: formatted[formatted.length - 1]?.order_date?.split('T')[0] || new Date().toISOString().split('T')[0]
        }
      }
    };
  }

  async getSalesSummary(timeframe: string): Promise<SalesSummaryResponse> {
    // Get current week/day range
    let startDate, endDate;

    if (timeframe === 'day') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (timeframe === 'month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else { // week
      const now = new Date();
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(now.getDate() + (6 - dayOfWeek));
      endDate.setHours(23, 59, 59, 999);
    }

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        unit_price,
        menu_items(id, name),
        orders(id)
      `)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString())
      .eq('orders.payment_status', 'paid')
      .eq('orders.status', 'completed');

    if (error) throw error;

    const totalQuantity = (data || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalRevenue = (data || []).reduce((sum, item) => sum + parseFloat(item.total_price || '0'), 0);
    const uniqueItems = new Set((data || []).map(item => item.menu_items?.id));
    const uniqueOrders = new Set((data || []).map(item => item.orders?.id));

    // Find top item
    const itemMap = new Map();
    (data || []).forEach(item => {
      const itemId = item.menu_items?.id;
      const itemName = item.menu_items?.name;
      if (!itemMap.has(itemId)) {
        itemMap.set(itemId, { name: itemName, quantity: 0 });
      }
      itemMap.get(itemId).quantity += item.quantity;
    });

    const topItem = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)[0] || { name: 'N/A', quantity: 0 };

    return {
      success: true,
      data: {
        total_items_sold: totalQuantity,
        total_revenue: totalRevenue.toString(),
        average_item_price: totalQuantity > 0 ? (totalRevenue / totalQuantity).toString() : '0',
        top_item: topItem,
        item_count: uniqueItems.size,
        orders_count: uniqueOrders.size
      },
      timeframe
    };
  }
}
```

---

## 6. Frontend Implementation

### Component 1: Best Sellers Card

**File:** `src/components/Dashboard/BestSellersCard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { useBestSellers } from '../../hooks/useBestSellers';

interface BestSellersCardProps {
  onViewMore?: () => void;
}

const BestSellersCard: React.FC<BestSellersCardProps> = ({ onViewMore }) => {
  const { bestSellers, isLoading, error } = useBestSellers();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Best Sellers</h3>
            <p className="text-xs text-gray-500">Current week</p>
          </div>
        </div>
        {onViewMore && (
          <button
            onClick={onViewMore}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bestSellers.slice(0, 5).map((item, index) => (
            <div key={item.menu_item_id} className="flex items-center justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">{item.rank}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.menu_item_name}</p>
                  <p className="text-xs text-gray-500">{item.total_quantity} sold</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">₱{parseFloat(item.total_revenue).toLocaleString()}</p>
                <p className="text-xs text-emerald-600">+{item.total_quantity}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BestSellersCard;
```

### Component 2: Best Sellers Modal

**File:** `src/components/Dashboard/BestSellersModal.tsx`

```typescript
import React, { useState } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useBestSellersByWeek } from '../../hooks/useBestSellersByWeek';

interface BestSellersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BestSellersModal: React.FC<BestSellersModalProps> = ({ isOpen, onClose }) => {
  const [week, setWeek] = useState(getCurrentWeek());
  const [year, setYear] = useState(new Date().getFullYear());
  const { bestSellers, isLoading, error, total, pages, currentPage, setPage } = useBestSellersByWeek(week, year);

  if (!isOpen) return null;

  const handleExport = () => {
    const csv = [
      ['Rank', 'Item', 'Quantity', 'Revenue', 'Avg Daily'],
      ...bestSellers.map(item => [
        item.rank,
        item.menu_item_name,
        item.total_quantity,
        item.total_revenue,
        item.average_daily_sales
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `best-sellers-week-${week}-${year}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Best Sellers Analysis</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Week Selector */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Week {week}, {year}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setWeek(Math.max(week - 1, 1))}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setWeek(Math.min(week + 1, 53))}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <div className="space-y-4">
              {bestSellers.map((item) => (
                <div key={item.menu_item_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">#{item.rank} {item.menu_item_name}</p>
                    <p className="text-sm text-gray-500">{item.total_quantity} units | Avg: {item.average_daily_sales}/day</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">₱{parseFloat(item.total_revenue).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center space-x-2 p-6 border-t border-gray-200">
            <button
              onClick={() => setPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {pages}
            </span>
            <button
              onClick={() => setPage(Math.min(currentPage + 1, pages))}
              disabled={currentPage === pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSellersModal;
```

---

## 7. Custom Hooks

### Hook 1: useBestSellers

**File:** `src/hooks/useBestSellers.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { BestSellerItem } from '../types/sales';

export const useBestSellers = () => {
  const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBestSellers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/sales/best-sellers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch best sellers');

      const data = await response.json();
      setBestSellers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBestSellers();
    const interval = setInterval(fetchBestSellers, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchBestSellers]);

  return { bestSellers, isLoading, error, refresh: fetchBestSellers };
};
```

### Hook 2: useBestSellersByWeek

**File:** `src/hooks/useBestSellersByWeek.ts`

```typescript
import { useState, useEffect } from 'react';
import { BestSellerItem } from '../types/sales';

export const useBestSellersByWeek = (week: number, year: number) => {
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

        const response = await fetch(
          `/api/admin/sales/best-sellers/week?week=${week}&year=${year}&page=${currentPage}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch best sellers');

        const data = await response.json();
        setBestSellers(data.data || []);
        setTotal(data.total_records || 0);
        setPages(data.page_info?.total || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestSellers();
  }, [week, year, currentPage]);

  return { bestSellers, isLoading, error, total, pages, currentPage, setPage: setCurrentPage };
};
```

### Hook 3: useSalesRecords

**File:** `src/hooks/useSalesRecords.ts`

```typescript
import { useState, useEffect } from 'react';
import { SalesRecord } from '../types/sales';

interface UseSalesRecordsParams {
  page?: number;
  limit?: number;
  menuItemId?: string;
  startDate?: string;
  endDate?: string;
}

export const useSalesRecords = (params: UseSalesRecordsParams = {}) => {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);
        const searchParams = new URLSearchParams({
          page: (params.page || 1).toString(),
          limit: (params.limit || 50).toString(),
          ...(params.menuItemId && { menu_item_id: params.menuItemId }),
          ...(params.startDate && { start_date: params.startDate }),
          ...(params.endDate && { end_date: params.endDate })
        });

        const response = await fetch(`/api/admin/sales/records?${searchParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch sales records');

        const data = await response.json();
        setRecords(data.data || []);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [params.page, params.limit, params.menuItemId, params.startDate, params.endDate]);

  return { records, isLoading, error, pagination };
};
```

---

## 8. Integration into Dashboard

### Update Dashboard.tsx

Add Best Sellers to the dashboard layout:

```typescript
import BestSellersCard from './BestSellersCard';
import BestSellersModal from './BestSellersModal';

const Dashboard = () => {
  const [showBestSellersModal, setShowBestSellersModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Existing content */}
      
      {/* New: Best Sellers Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BestSellersCard onViewMore={() => setShowBestSellersModal(true)} />
        {/* Another card here */}
      </div>

      {/* Modal */}
      <BestSellersModal 
        isOpen={showBestSellersModal} 
        onClose={() => setShowBestSellersModal(false)} 
      />
    </div>
  );
};
```

---

## 9. API Integration Updates

### Add to `src/utils/api.ts`

```typescript
export const api = {
  // ... existing endpoints
  
  sales: {
    getBestSellers: (limit = 10) => 
      fetch(`${API_URL}/admin/sales/best-sellers?limit=${limit}`),
    
    getBestSellersByWeek: (week: number, year: number, limit = 10) =>
      fetch(`${API_URL}/admin/sales/best-sellers/week?week=${week}&year=${year}&limit=${limit}`),
    
    getSalesRecords: (page = 1, limit = 50, filters = {}) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      return fetch(`${API_URL}/admin/sales/records?${params}`);
    },
    
    getSalesSummary: (timeframe = 'week') =>
      fetch(`${API_URL}/admin/sales/summary?timeframe=${timeframe}`)
  }
};
```

---

## 10. Implementation Checklist

### Backend (Node.js)
- [ ] Create `routes/admin/sales.ts`
- [ ] Create `controllers/SalesController.ts`
- [ ] Create `services/SalesService.ts`
- [ ] Add type definitions `types/sales.ts`
- [ ] Create database views & indexes
- [ ] Add endpoint validation & error handling
- [ ] Add authentication middleware checks
- [ ] Write unit tests for service layer
- [ ] Write integration tests for endpoints

### Frontend (React)
- [ ] Create `types/sales.ts` type definitions
- [ ] Create `hooks/useBestSellers.ts`
- [ ] Create `hooks/useBestSellersByWeek.ts`
- [ ] Create `hooks/useSalesRecords.ts`
- [ ] Create `BestSellersCard.tsx` component
- [ ] Create `BestSellersModal.tsx` component
- [ ] Create `SalesRecordsTable.tsx` component
- [ ] Update `Dashboard.tsx` with new components
- [ ] Update `src/utils/api.ts` with new endpoints
- [ ] Write component tests
- [ ] Test responsive design

### Database
- [ ] Create `sales_metrics` materialized view
- [ ] Create performance indexes (11 indexes)
- [ ] Create `daily_sales_snapshot` table (optional)
- [ ] Test query performance with large datasets
- [ ] Set up materialized view refresh strategy

### Documentation
- [ ] Document API endpoints
- [ ] Create component storybook entries
- [ ] Write deployment guide
- [ ] Create data refresh schedule documentation

---

## 11. Performance Considerations

### Query Optimization
- Use materialized views for aggregated data
- Index week_number, year, menu_item_id
- Limit date ranges to improve query speed
- Cache sales_metrics for 1 hour

### Frontend Optimization
- Lazy load modal components
- Paginate large datasets (max 50 records)
- Memoize expensive components
- Use virtual scrolling for large tables (if >1000 rows)

### Caching Strategy
- Cache best sellers for current week: 30 minutes
- Cache historical data: 1 hour
- Cache sales records: 5 minutes

---

## 12. Testing Strategy

### Unit Tests
- Test week/year validation
- Test pagination calculations
- Test date range filtering
- Test CSV export format

### Integration Tests
- Test end-to-end API calls
- Test database query accuracy
- Test permission checks
- Test error handling

### Performance Tests
- Load test with 10k records
- Test query performance < 500ms
- Test pagination with 1M records

---

## 13. Deployment Steps

### Phase 1: Database
1. Create `sales_metrics` view in Supabase
2. Create performance indexes
3. Verify query performance

### Phase 2: Backend
1. Deploy API routes
2. Test endpoints manually with curl
3. Verify authentication
4. Monitor error logs

### Phase 3: Frontend
1. Deploy React components
2. Test against live API
3. Verify responsive design
4. Performance test on mobile

---

## 14. Future Enhancements

### V2 Features
- Sales forecasting using historical data
- Seasonal trend analysis
- Item recommendations based on sales patterns
- Price elasticity analysis
- Inventory optimization recommendations
- Real-time sales dashboard
- Mobile app sales viewing

### V3 Features
- AI-powered menu optimization
- Dynamic pricing suggestions
- Customer purchase pattern analysis
- Predictive analytics
- Integration with accounting software

---

**Estimated Timeline:**
- Backend: 8-10 hours
- Frontend: 6-8 hours
- Database: 1-2 hours
- Testing: 3-4 hours
- **Total: 18-24 hours**

**Priority:** HIGH
**Status:** Ready for Implementation
