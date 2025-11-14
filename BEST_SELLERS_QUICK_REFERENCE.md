# Best Sellers Feature - Quick Implementation Guide

**Status:** Ready to Build  
**Estimated Time:** 18-24 hours  
**Priority:** HIGH

---

## Quick Overview

You requested 3 API endpoints for sales analytics:
1. **GET /api/admin/sales/best-sellers** - Current week top items
2. **GET /api/admin/sales/best-sellers/week** - Any week/year top items
3. **GET /api/admin/sales/records** - Paginated detailed sales records

---

## Step-by-Step Implementation

### STEP 1: Database Setup (30 minutes)
**File:** `BEST_SELLERS_DATABASE_MIGRATION.sql`

```bash
# In Supabase SQL Editor:
1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Click "New Query"
3. Copy entire BEST_SELLERS_DATABASE_MIGRATION.sql
4. Click "Run"
5. Verify:
   - sales_metrics view created
   - 7 indexes created
   - (Optional) daily_sales_snapshot table created
```

**What it creates:**
- ✅ `sales_metrics` materialized view (best sellers aggregation)
- ✅ 7 performance indexes
- ✅ RLS policies (optional security)

---

### STEP 2: Backend API Implementation (8-10 hours)

#### File 2.1: Type Definitions
**Location:** `src/types/sales.ts`

Copy from `BEST_SELLERS_FEATURE_PLAN.md` → Section 4: Type Definitions

```typescript
// sales.ts - 150+ lines of TypeScript types
export interface BestSellerItem {
  rank: number;
  menu_item_id: string;
  menu_item_name: string;
  total_quantity: number;
  total_revenue: string;
  average_daily_sales: string;
  growth_percentage?: number;
  last_week_quantity?: number;
}
// ... (see plan for full types)
```

#### File 2.2: Route Definition
**Location:** `routes/admin/sales.ts`

Copy from `BEST_SELLERS_FEATURE_PLAN.md` → Section 5: Routes

```typescript
// 40 lines - Defines 4 GET endpoints with auth middleware
router.get('/best-sellers', salesController.getBestSellers...);
router.get('/best-sellers/week', salesController.getBestSellersByWeek...);
router.get('/records', salesController.getSalesRecords...);
router.get('/summary', salesController.getSalesSummary...);
```

#### File 2.3: Controller
**Location:** `controllers/SalesController.ts`

Copy from `BEST_SELLERS_FEATURE_PLAN.md` → Section 5: SalesController

```typescript
// 150 lines - Handles request validation and response formatting
class SalesController {
  async getBestSellers(req, res) { ... }
  async getBestSellersByWeek(req, res) { ... }
  async getSalesRecords(req, res) { ... }
  async getSalesSummary(req, res) { ... }
}
```

#### File 2.4: Service Layer
**Location:** `services/SalesService.ts`

Copy from `BEST_SELLERS_FEATURE_PLAN.md` → Section 5: SalesService

```typescript
// 250+ lines - Core business logic and Supabase queries
class SalesService {
  async getBestSellersByWeek(week, year, limit, offset) { ... }
  async getSalesRecords(params) { ... }
  async getSalesSummary(timeframe) { ... }
}
```

#### File 2.5: Utility Functions
**Create:** `utils/dateUtils.ts`

```typescript
export const getCurrentWeek = (): number => {
  return Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), 0, 1).getDay()) / 7);
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export const getWeekDateRange = (week: number, year: number) => {
  // Returns start and end date of ISO week
};
```

**Steps:**
1. Create 4 files (types, routes, controller, service)
2. Copy code from plan sections
3. Register routes in main app file
4. Test with curl/Postman
5. Add error handling

---

### STEP 3: Frontend Implementation (6-8 hours)

#### File 3.1: Type Definitions (Frontend)
**Location:** `src/types/sales.ts`

Same as backend types (copy from backend after created)

#### File 3.2: Custom Hooks
**Location:** `src/hooks/useBestSellers.ts`

```typescript
// 50 lines - Hook to fetch current week best sellers
export const useBestSellers = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Auto-refresh every 5 minutes
}
```

**Create 3 hooks:**
1. `useBestSellers()` - Current week
2. `useBestSellersByWeek(week, year)` - Any week
3. `useSalesRecords(params)` - Paginated records

Copy from `BEST_SELLERS_FEATURE_PLAN.md` → Section 7: Custom Hooks

#### File 3.3: Components
**Location:** `src/components/Dashboard/BestSellersCard.tsx`

```typescript
// 120 lines - Card showing top 5 best sellers with View All button
// Displays: Rank, Item Name, Quantity, Revenue
```

**Create 2 components:**
1. `BestSellersCard.tsx` - Dashboard card (5 items)
2. `BestSellersModal.tsx` - Full modal with week selector + pagination

Copy from `BEST_SELLERS_FEATURE_PLAN.md` → Section 6: Components

#### File 3.4: API Integration
**Update:** `src/utils/api.ts`

Add to existing api object:

```typescript
export const api = {
  // ... existing
  sales: {
    getBestSellers: (limit) => fetch(`/api/admin/sales/best-sellers?limit=${limit}`),
    getBestSellersByWeek: (week, year, limit) => { ... },
    getSalesRecords: (page, limit, filters) => { ... },
    getSalesSummary: (timeframe) => { ... }
  }
}
```

#### File 3.5: Update Dashboard
**Update:** `src/components/Dashboard/Dashboard.tsx`

```typescript
import BestSellersCard from './BestSellersCard';
import BestSellersModal from './BestSellersModal';

const Dashboard = () => {
  const [showBestSellersModal, setShowBestSellersModal] = useState(false);

  return (
    <div>
      {/* Existing content */}
      
      {/* ADD THIS: */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BestSellersCard onViewMore={() => setShowBestSellersModal(true)} />
      </div>

      <BestSellersModal 
        isOpen={showBestSellersModal} 
        onClose={() => setShowBestSellersModal(false)} 
      />
    </div>
  );
};
```

---

## Implementation Checklist

### Database (30 min)
- [ ] Copy `BEST_SELLERS_DATABASE_MIGRATION.sql`
- [ ] Run in Supabase SQL Editor
- [ ] Verify tables created
- [ ] Test queries work

### Backend (8-10 hours)
- [ ] Create `src/types/sales.ts`
- [ ] Create `src/routes/admin/sales.ts`
- [ ] Create `src/controllers/SalesController.ts`
- [ ] Create `src/services/SalesService.ts`
- [ ] Create `src/utils/dateUtils.ts`
- [ ] Register routes in app
- [ ] Test endpoints with curl/Postman
- [ ] Add error handling
- [ ] Add validation

### Frontend (6-8 hours)
- [ ] Create `src/hooks/useBestSellers.ts`
- [ ] Create `src/hooks/useBestSellersByWeek.ts`
- [ ] Create `src/hooks/useSalesRecords.ts`
- [ ] Create `src/components/Dashboard/BestSellersCard.tsx`
- [ ] Create `src/components/Dashboard/BestSellersModal.tsx`
- [ ] Update `src/utils/api.ts`
- [ ] Update `src/components/Dashboard/Dashboard.tsx`
- [ ] Test responsive design
- [ ] Test data flows

### Testing (3-4 hours)
- [ ] Unit tests for service layer
- [ ] Integration tests for API
- [ ] Component tests
- [ ] End-to-end tests
- [ ] Performance tests

---

## Testing the API (Before Frontend)

### Test 1: Current Week Best Sellers
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/sales/best-sellers?limit=10"
```

Expected response:
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
      "average_daily_sales": "17.14"
    }
  ],
  "week": 46,
  "year": 2025,
  "total_records": 127,
  "page_info": { "current": 1, "total": 13, "limit": 10 }
}
```

### Test 2: Specific Week Best Sellers
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/sales/best-sellers/week?week=45&year=2025&limit=10"
```

### Test 3: Sales Records (Paginated)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/sales/records?page=1&limit=50"
```

### Test 4: Sales Summary
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/sales/summary?timeframe=week"
```

---

## File Structure Summary

```
Backend:
├── src/
│   ├── types/
│   │   └── sales.ts (NEW - 200 lines)
│   ├── routes/admin/
│   │   └── sales.ts (NEW - 40 lines)
│   ├── controllers/
│   │   └── SalesController.ts (NEW - 150 lines)
│   ├── services/
│   │   └── SalesService.ts (NEW - 250 lines)
│   └── utils/
│       └── dateUtils.ts (NEW - 50 lines)

Frontend:
├── src/
│   ├── types/
│   │   └── sales.ts (NEW - 200 lines, copied from backend)
│   ├── hooks/
│   │   ├── useBestSellers.ts (NEW - 50 lines)
│   │   ├── useBestSellersByWeek.ts (NEW - 60 lines)
│   │   └── useSalesRecords.ts (NEW - 70 lines)
│   ├── components/Dashboard/
│   │   ├── BestSellersCard.tsx (NEW - 120 lines)
│   │   └── BestSellersModal.tsx (NEW - 250 lines)
│   └── utils/
│       └── api.ts (UPDATED - add sales methods)

Database:
└── BEST_SELLERS_DATABASE_MIGRATION.sql (NEW - 150 lines)
```

**Total New Code:** ~2,000+ lines
**Total Files:** 12 new files + 2 updates

---

## Key Features

✅ **Responsive Design** - Works on mobile/tablet/desktop  
✅ **Pagination** - Handles large datasets  
✅ **Filtering** - By date range, menu item  
✅ **Export** - CSV export functionality  
✅ **Real-time** - Auto-refresh every 5 minutes  
✅ **Error Handling** - Graceful fallbacks  
✅ **Type Safety** - Full TypeScript types  
✅ **Performance** - Indexes and materialized views  
✅ **Security** - JWT auth + admin-only access  
✅ **Accessibility** - WCAG compliance  

---

## Next Steps

### Today (Planning Phase - DONE ✅)
1. ✅ Create comprehensive feature plan
2. ✅ Design database schema
3. ✅ Define API specifications
4. ✅ Create TypeScript types
5. ✅ Design React components

### This Week (Implementation Phase)
1. Deploy database migration
2. Build backend endpoints
3. Test API endpoints
4. Build React components
5. Test frontend integration

### Next Week (Testing & Polish)
1. Unit tests
2. Integration tests
3. Performance optimization
4. Bug fixes
5. Production deployment

---

## Support Documents

All code examples available in:
- **Full Implementation Plan:** `BEST_SELLERS_FEATURE_PLAN.md`
- **Database Migration:** `BEST_SELLERS_DATABASE_MIGRATION.sql`
- **This Quick Reference:** `BEST_SELLERS_QUICK_REFERENCE.md`

---

**Questions?**

Refer to:
- Section 5 in BEST_SELLERS_FEATURE_PLAN.md for backend code
- Section 6 in BEST_SELLERS_FEATURE_PLAN.md for frontend code
- Section 7 in BEST_SELLERS_FEATURE_PLAN.md for custom hooks

---

**Ready to Build!** 🚀

Start with Step 1 (Database) and follow the checklist.
Total effort: **18-24 hours** depending on your experience level.
