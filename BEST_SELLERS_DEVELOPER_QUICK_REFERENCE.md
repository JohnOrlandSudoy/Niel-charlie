# Best Sellers Feature - Developer Quick Reference

## Quick Start

### Using BestSellersCard (Dashboard Widget)
```tsx
import BestSellersCard from '@/components/Dashboard/BestSellersCard';

<BestSellersCard onViewMore={() => setShowModal(true)} />
```

### Using BestSellersModal (Full Analysis)
```tsx
import BestSellersModal from '@/components/Dashboard/BestSellersModal';

const [isOpen, setIsOpen] = useState(false);

<BestSellersModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

### Using SalesRecordsTable (Data Table)
```tsx
import SalesRecordsTable from '@/components/Dashboard/SalesRecordsTable';

<SalesRecordsTable 
  menuItemId={selectedItemId}
  startDate="2025-11-01"
  endDate="2025-11-30"
/>
```

---

## Hooks Reference

### useBestSellers
```tsx
const { bestSellers, isLoading, error, week, year, refresh } = useBestSellers(limit);

// bestSellers: BestSellerItem[]
// isLoading: boolean
// error: string | null
// week: number (ISO week)
// year: number
// refresh: () => Promise<void>
```

### useBestSellersByWeek
```tsx
const { bestSellers, isLoading, error, total, pages, currentPage, setPage } = 
  useBestSellersByWeek(week, year, limit);

// setPage: (page: number) => void
```

### useSalesRecords
```tsx
const { records, isLoading, error, pagination } = useSalesRecords({
  page: 1,
  limit: 50,
  menu_item_id: 'optional-uuid',
  start_date: 'YYYY-MM-DD',
  end_date: 'YYYY-MM-DD',
  sort_by: 'date', // 'quantity' | 'revenue' | 'date'
  sort_order: 'desc', // 'asc' | 'desc'
});

// pagination: { current_page, total_pages, total_items, items_per_page }
```

---

## API Methods

```tsx
import { api } from '@/utils/api';

// Get current week best sellers
const response = await api.sales.getBestSellers(limit, offset);

// Get best sellers for specific week
const response = await api.sales.getBestSellersByWeek(week, year, limit, offset);

// Get paginated sales records
const response = await api.sales.getSalesRecords(page, limit, filters);

// Get sales summary
const response = await api.sales.getSalesSummary(timeframe);
```

---

## Type Definitions

```tsx
// BestSellerItem
interface BestSellerItem {
  rank: number;
  menu_item_id: string;
  menu_item_name: string;
  total_quantity: number;
  total_revenue: string | number;
  average_daily_sales: number;
  growth_percentage?: number;
  last_week_quantity?: number;
}

// SalesRecord
interface SalesRecord {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
  order_date: string;
  payment_status: 'paid' | 'pending' | 'failed';
}

// SalesSummary
interface SalesSummary {
  total_items_sold: number;
  total_revenue: number;
  average_item_price: number;
  top_item: { name: string; quantity: number };
  item_count: number;
  orders_count: number;
}
```

---

## Common Patterns

### Refreshing Data
```tsx
const { refresh } = useBestSellers();

const handleRefresh = async () => {
  try {
    await refresh();
  } catch (error) {
    console.error('Refresh failed:', error);
  }
};
```

### Filtering Records
```tsx
const { records } = useSalesRecords({
  page: 1,
  limit: 50,
  menu_item_id: selectedMenuItemId,
  start_date: startDate,
  end_date: endDate,
  sort_by: 'revenue',
  sort_order: 'desc',
});
```

### Exporting Data
```tsx
const handleExport = (data: any[]) => {
  const csv = [
    ['Column1', 'Column2', 'Column3'],
    ...data.map(row => [row.field1, row.field2, row.field3])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
```

---

## Error Handling

All hooks include built-in error handling:

```tsx
const { records, error, isLoading } = useSalesRecords({ ... });

if (isLoading) return <Loader />;
if (error) return <ErrorMessage message={error} />;
if (records.length === 0) return <EmptyState />;

// Render records
```

---

## Troubleshooting

### Data Not Updating
- Check if auto-refresh interval is working (5 minutes)
- Call `refresh()` function manually
- Check browser console for API errors
- Verify authentication token exists

### Pagination Not Working
- Ensure `limit` parameter is ≤ 100
- Check `offset` calculation: `(page - 1) * limit`
- Verify pagination metadata returned from API

### CSV Export Not Working
- Check if data array is not empty
- Verify blob is created correctly
- Check for CORS issues in browser console
- Ensure URL revocation happens after download

### Sorting Not Working
- Reset pagination to page 1 when sorting
- Valid sort_by values: 'quantity', 'revenue', 'date'
- Valid sort_order values: 'asc', 'desc'

---

## Performance Tips

1. **Pagination:** Use limit=25-50 for best performance
2. **Filtering:** Minimize date ranges when filtering
3. **Auto-refresh:** Default is 5 minutes (configurable)
4. **Exports:** Keep data set < 10,000 rows
5. **Sorting:** Avoid sorting large datasets on frontend

---

## Mobile Responsive

All components are fully responsive:
- BestSellersCard: Stacks vertically on mobile
- BestSellersModal: Full-width modal with touch-friendly controls
- SalesRecordsTable: Horizontal scroll on mobile
- Export buttons: Hidden text on small screens, icon only

---

## Authentication

- Automatically uses token from `localStorage.admin_token`
- Falls back to AuthContext token if not available
- Sent as Bearer token in Authorization header
- Automatic 401 handling with context

---

## Offline Support

All API calls through `apiRequest()` wrapper:
- Attempts network request first
- Falls back to localStorage cache if offline
- Retries when connection restored
- Shows offline indicator to user

---

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile: iOS Safari 14+, Chrome Mobile 90+

---

## Files Location

```
src/
├── components/Dashboard/
│   ├── BestSellersCard.tsx
│   ├── BestSellersModal.tsx
│   └── SalesRecordsTable.tsx
├── hooks/
│   ├── useBestSellers.ts
│   ├── useBestSellersByWeek.ts
│   └── useSalesRecords.ts
├── types/
│   └── sales.ts
└── utils/
    └── api.ts (has sales methods)
```

---

## Related Documentation

- [BEST_SELLERS_FEATURE_PLAN.md](./BEST_SELLERS_FEATURE_PLAN.md) - Full feature specification
- [BEST_SELLERS_DATABASE_MIGRATION.sql](./BEST_SELLERS_DATABASE_MIGRATION.sql) - Database setup
- [BEST_SELLERS_IMPLEMENTATION_COMPLETE.md](./BEST_SELLERS_IMPLEMENTATION_COMPLETE.md) - Implementation details

---

## Support

For issues or questions:
1. Check the error message in browser console
2. Review troubleshooting section above
3. Check API endpoint logs
4. Verify database queries are returning data
5. Ensure all TypeScript types match API responses
