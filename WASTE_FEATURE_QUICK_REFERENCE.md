# Waste Feature Implementation Quick Reference
**Fast lookup guide for waste/spillage/spoilage feature**

---

## 🚀 Quick Start

### What to Build
New waste tracking tab in Kitchen Dashboard that lets kitchen staff report:
- **Spoilage** (expired, discolored, odor issues)
- **Spillage** (dropped, broken container, accidental waste)
- With quantity, reason, cost tracking

### Where It Goes
- **Kitchen Dashboard** → Add 4th tab: "Waste & Spoilage"
- **Report Button** → Header next to "Refresh" button
- **Modal Form** → Pops up when staff clicks "Report Waste"

---

## 📦 Database (Already Partially Ready)

### New Tables Needed

**`waste_logs` table:**
```sql
- id, restaurant_id, ingredient_id
- waste_type: 'spoilage' | 'spillage' | 'other'
- quantity_wasted, unit
- reason: 'expired' | 'damaged' | 'dropped' | 'discolored' | 'odor' | 'other'
- reported_by_user_id, timestamp_reported
- location_in_kitchen, shift
- estimated_cost (auto-calculated)
- is_resolved (for manager approval)
- created_at
```

**`waste_categories` table:**
```sql
- id, restaurant_id, category_name
- category_type, target_waste_percentage
- is_active
```

### Existing Support
✅ `spoilage` movement type already in `inventory_movements` table
✅ `spoilage` already in types/inventory.ts

---

## 🎨 UI Components to Create

### 1. WasteReportModal
```typescript
// src/components/Kitchen/WasteReportModal.tsx
Popup form with:
- Ingredient dropdown (searchable)
- Waste type selector (radio buttons)
- Quantity input + unit dropdown
- Reason dropdown
- Kitchen location (Fridge/Freezer/Prep Area)
- Shift selector
- Optional description
- Auto-calculated estimated cost
- Submit button
```

### 2. WasteDashboardTab
```typescript
// src/components/Kitchen/WasteDashboardTab.tsx
Main tab content with:
- Summary stats (waste today, week, month in qty & cost)
- List of waste reports (paginated)
- Charts (waste by type, top ingredients, by reason)
- Export button
- Filter controls
```

### 3. WasteReportCard
```typescript
// src/components/Kitchen/WasteReportCard.tsx
Single waste report display:
- Ingredient name
- Waste type + reason badges
- Quantity wasted
- Reported by + timestamp
- Estimated cost
- Status (pending/resolved)
- Resolve button
```

---

## 🔌 API Endpoints Needed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/waste/report` | Submit waste incident |
| GET | `/api/waste/reports` | List waste reports (paginated) |
| GET | `/api/waste/stats` | Get waste statistics |
| GET | `/api/waste/reports/:id` | Get single report |
| PUT | `/api/waste/reports/:id/resolve` | Mark resolved (manager) |
| GET | `/api/waste/export` | Export as Excel/PDF |

---

## 📋 Type Definitions

### Create `src/types/waste.ts`

```typescript
export interface WasteLog {
  id: string;
  ingredient_id: string;
  waste_type: 'spoilage' | 'spillage' | 'other';
  quantity_wasted: number;
  unit: string;
  reason: string;
  reported_by_name: string;
  timestamp_reported: string;
  location_in_kitchen: string;
  estimated_cost?: number;
  is_resolved: boolean;
}

export interface WasteReportRequest {
  ingredient_id: string;
  waste_type: 'spoilage' | 'spillage' | 'other';
  quantity_wasted: number;
  unit: string;
  reason: string;
  description?: string;
  location_in_kitchen: string;
}

export interface WasteStats {
  total_waste_today: number;
  total_cost_today: number;
  total_waste_week: number;
  total_cost_week: number;
  most_wasted_ingredient: string;
  waste_by_type: Record<string, number>;
}
```

---

## 🔄 Integration Steps

### Step 1: Kitchen Dashboard Header Button
```typescript
// In KitchenDashboard.tsx, add to header next to Refresh:
<button
  onClick={() => setShowWasteModal(true)}
  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
>
  <Trash2 className="h-4 w-4 inline mr-2" />
  Report Waste
</button>
```

### Step 2: Add 4th Tab
```typescript
// In KitchenDashboard.tsx tabs array, add:
{
  id: 'waste',
  label: 'Waste & Spoilage',
  icon: AlertTriangle,
  badge: unresolved_count  // Show # of pending
}
```

### Step 3: Inventory Deduction
```typescript
// When waste is reported, auto-deduct from inventory:
await api.inventory.createMovement({
  ingredient_id: report.ingredient_id,
  movement_type: 'spoilage',
  quantity_moved: report.quantity_wasted,
  reference_id: report.id
});
// This auto-updates ingredient.current_stock
```

### Step 4: Add Notifications
```typescript
// When waste reported, show notification:
addNotification(`Waste reported: ${ingredient} (${qty} ${unit})`);
```

---

## 💾 Hook to Create

### `src/hooks/useWasteManagement.ts`

```typescript
export const useWasteManagement = () => {
  const [wasteReports, setWasteReports] = useState<WasteLog[]>([]);
  const [stats, setStats] = useState<WasteStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWasteReports = async (filters?: any) => {
    // GET /api/waste/reports
  };

  const reportWaste = async (data: WasteReportRequest) => {
    // POST /api/waste/report
    // Auto-deduct from inventory
    // Add notification
  };

  const resolveWaste = async (id: string, notes?: string) => {
    // PUT /api/waste/reports/:id/resolve
  };

  const fetchStats = async () => {
    // GET /api/waste/stats
  };

  return {
    wasteReports,
    stats,
    isLoading,
    fetchWasteReports,
    reportWaste,
    resolveWaste,
    fetchStats
  };
};
```

---

## 🎯 Implementation Order

1. **Database** - Create tables & migration
2. **Types** - Create waste.ts with interfaces
3. **API** - Implement backend endpoints
4. **Hook** - Create useWasteManagement hook
5. **Modal** - Build WasteReportModal component
6. **Cards** - Build WasteReportCard component
7. **Tab** - Build WasteDashboardTab component
8. **Integration** - Wire into KitchenDashboard
9. **Testing** - Test end-to-end workflow
10. **Polish** - UI refinement, exports, analytics

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Report waste form submits correctly
- [ ] Ingredient inventory decreases after waste report
- [ ] Low-stock alerts trigger when stock drops
- [ ] Waste stats update in real-time
- [ ] Filter/search works on waste list
- [ ] Export to Excel works
- [ ] Mobile responsiveness

### Edge Cases
- [ ] Reporting waste > available inventory (should allow, warn)
- [ ] Multiple waste reports same ingredient same day
- [ ] Waste report without description (optional field)
- [ ] Very large quantities or unusual units
- [ ] User permissions (staff can't resolve)

### Performance
- [ ] Waste report < 1s submit
- [ ] Dashboard loads < 2s
- [ ] Export 1000+ records < 5s
- [ ] No memory leaks with auto-refresh

---

## 🎨 Form Field Validations

```typescript
const validations = {
  ingredient_id: 'required',
  waste_type: 'required | must be spoilage/spillage/other',
  quantity_wasted: 'required | must be > 0 | max 999.999',
  unit: 'required | must match ingredient unit',
  reason: 'required',
  description: 'optional | max 500 chars',
  location_in_kitchen: 'required',
  shift: 'optional | must be morning/afternoon/night'
};
```

---

## 📊 Charts to Include

1. **Pie Chart:** Waste by type (spoilage vs spillage)
2. **Bar Chart:** Top 5 wasted ingredients
3. **Bar Chart:** Waste by reason
4. **Line Chart:** Daily waste trend (last 30 days)
5. **Stat Cards:** Today's total, weekly total, monthly total

Use **Recharts** library for all charts.

---

## 🔐 Permissions Matrix

```
Kitchen Staff:
✓ Report waste
✓ View own reports
✓ View all reports (current shift)
✗ Edit/delete reports
✗ Resolve/approve

Manager:
✓ Report waste
✓ View all reports
✓ Edit reports
✓ Resolve/approve with notes
✓ Export data
✗ Delete reports

Admin:
✓ Everything
✓ Delete reports
✓ Manage waste categories
```

---

## 🚨 Key Considerations

### Cost Calculation
- `estimated_cost = quantity_wasted * ingredient.cost_per_unit`
- Show in red if > ₱500

### Auto-deduction from Inventory
- When waste reported → create `inventory_movement` with type='spoilage'
- This automatically updates `ingredient.current_stock`
- Triggers low-stock notification if below min_stock_threshold

### Batch Spoilage
- If entire batch spoils → allow entering batch_id
- Group related waste reports together
- Show in analytics as "Batch spoilage event"

### Audit Trail
- Store who reported, when, and what
- Store who resolved, when, and notes
- Never delete waste records (soft delete if needed)

---

## 📚 Related Files to Reference

- **KitchenDashboard.tsx** → Tab structure, header layout
- **Kitchen.ts types** → Order/ingredient data structure
- **inventory.ts types** → Movement type enum
- **OrderHistory.tsx** → Filtering/pagination patterns
- **Dashboard.tsx** → Stats card layout
- **useInventoryStock.ts** → Inventory hook pattern

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Inventory not updating | Check createMovement API call, ensure type='spoilage' |
| Stats not showing | Verify API endpoint returns WasteStats format |
| Modal not opening | Check onClick handler, ensure state updates |
| Export fails | Verify XLSX library installed, check date formats |
| Notifications not showing | Check notification system in parent component |
| Mobile layout broken | Review Tailwind responsive classes (sm:, md:, lg:) |

---

## 📞 Quick Links

- **Kitchen Plan:** WASTE_SPILLAGE_SPOILAGE_FEATURE_PLAN.md
- **Database Schema:** SUPABASE_COMPLETE_SCHEMA.sql
- **Types Reference:** src/types/
- **API Patterns:** src/utils/api.ts
- **Kitchen Component:** src/components/Kitchen/KitchenDashboard.tsx

---

**Version:** 1.0  
**Last Updated:** November 13, 2025  
**Quick Ref Status:** Ready to use for development
