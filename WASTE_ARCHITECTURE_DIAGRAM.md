# Waste Feature Architecture Diagram
**System design, data flow, and component relationships**

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        KITCHEN DASHBOARD (Frontend)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Orders Tab   │  │Inventory Tab │  │Equipment Tab │  │ Waste Tab  │ │
│  │ (Existing)   │  │ (Existing)   │  │ (Existing)  │  │ (NEW)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│         │                                                      │        │
│         └──────────────────────┬───────────────────────────────┘        │
│                                │                                        │
│                          ┌─────▼─────┐                                 │
│                          │   Header   │                                 │
│                          │  + "Report │                                 │
│                          │   Waste"   │                                 │
│                          │  button    │                                 │
│                          └─────┬─────┘                                  │
│                                │                                        │
│                    ┌───────────▼───────────┐                           │
│                    │ WasteReportModal      │                           │
│                    │ (Popup Form)          │                           │
│                    │ - Ingredient selector │                           │
│                    │ - Waste type          │                           │
│                    │ - Quantity            │                           │
│                    │ - Reason              │                           │
│                    │ - Cost calculator     │                           │
│                    └───────────┬───────────┘                           │
│                                │                                        │
│              ┌─────────────────▼──────────────────┐                    │
│              │    WasteDashboardTab (NEW)        │                    │
│              │  - Stats cards                    │                    │
│              │  - Reports list                   │                    │
│              │  - Charts & analytics             │                    │
│              │  - Export buttons                 │                    │
│              └─────────────────┬──────────────────┘                    │
│                                │                                        │
│              ┌─────────────────▼──────────────────┐                    │
│              │   WasteReportCard (for each item) │                    │
│              │   - Ingredient + quantity         │                    │
│              │   - Cost display                  │                    │
│              │   - Resolve button (manager)      │                    │
│              └──────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
          │
          │ HTTP/REST API
          │
┌─────────▼─────────────────────────────────────────────────────────────┐
│                   BACKEND API (Node.js/Express)                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  API Endpoints (Express Routes)                                  ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │                                                                  ││
│  │  POST   /api/waste/report          → Report waste incident      ││
│  │  GET    /api/waste/reports         → List reports (paginated)   ││
│  │  GET    /api/waste/stats           → Get statistics             ││
│  │  GET    /api/waste/reports/:id     → Get single report          ││
│  │  PUT    /api/waste/reports/:id/resolve → Resolve report         ││
│  │  DELETE /api/waste/reports/:id     → Delete (admin only)        ││
│  │  GET    /api/waste/export          → Export Excel/PDF           ││
│  │  GET    /api/waste/trends          → Trend data for charts      ││
│  │                                                                  ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Business Logic Layer                                            ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │                                                                  ││
│  │  • Waste report validation                                       ││
│  │  • Cost calculation (qty × ingredient.cost_per_unit)            ││
│  │  • Inventory movement creation (spoilage)                        ││
│  │  • Statistics calculation                                        ││
│  │  • Export generation (Excel/PDF)                                 ││
│  │  • Authorization checks (role-based)                             ││
│  │                                                                  ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
          │
          │ SQL Queries
          │
┌─────────▼─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (PostgreSQL)                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Tables (Relational Data)                                        ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │                                                                  ││
│  │  waste_logs                                                      ││
│  │  ├─ id, restaurant_id, ingredient_id                            ││
│  │  ├─ waste_type, quantity_wasted, unit                           ││
│  │  ├─ reason, description, notes                                  ││
│  │  ├─ reported_by_user_id, reported_by_name                       ││
│  │  ├─ is_resolved, manager_notes, resolved_at                     ││
│  │  ├─ estimated_cost, batch_id                                    ││
│  │  ├─ location_in_kitchen, shift                                  ││
│  │  └─ created_at, updated_at                                      ││
│  │                                                                  ││
│  │  waste_categories                                                ││
│  │  ├─ id, restaurant_id, category_name                            ││
│  │  ├─ category_type, target_waste_percentage                      ││
│  │  └─ is_active                                                   ││
│  │                                                                  ││
│  │  waste_statistics (aggregated daily)                             ││
│  │  ├─ id, restaurant_id, date_recorded                            ││
│  │  ├─ total_waste_quantity, total_waste_cost                      ││
│  │  ├─ spoilage_qty, spillage_qty, other_qty                       ││
│  │  ├─ waste_count, top_wasted_ingredient                          ││
│  │  └─ shift breakdowns                                            ││
│  │                                                                  ││
│  │  waste_audit_log (compliance)                                    ││
│  │  ├─ id, waste_log_id, action                                    ││
│  │  ├─ action_by_user_id, action_timestamp                         ││
│  │  └─ old_values, new_values (JSONB)                              ││
│  │                                                                  ││
│  │  ingredients (existing - used for joins)                         ││
│  │  inventory_movements (existing - for spoilage type)              ││
│  │                                                                  ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Views & Functions (Query Helpers)                               ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │                                                                  ││
│  │  recent_waste_reports (VIEW)                                     ││
│  │  unresolved_waste_reports (VIEW)                                 ││
│  │  daily_waste_summary (VIEW)                                      ││
│  │                                                                  ││
│  │  create_waste_inventory_movement() (TRIGGER FUNCTION)            ││
│  │  update_waste_statistics() (TRIGGER FUNCTION)                    ││
│  │  report_waste() (STORED PROCEDURE)                               ││
│  │  calculate_daily_waste_statistics() (FUNCTION)                   ││
│  │                                                                  ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### Scenario 1: Report Waste Incident

```
Kitchen Staff                Frontend                Backend              Database
    │                           │                         │                   │
    │─── Click "Report Waste"───>│                         │                   │
    │                    │       │                         │                   │
    │                    │   Open WasteReportModal         │                   │
    │                    │       │                         │                   │
    │<── Form with ingredients ──│                         │                   │
    │                           │                         │                   │
    │─── Fill form & submit ───>│                         │                   │
    │                    │       │                         │                   │
    │                    │  Validate form locally          │                   │
    │                    │       │                         │                   │
    │                    │  POST /api/waste/report         │                   │
    │                    │─────────────────────────────────>│                   │
    │                    │       │                         │                   │
    │                    │       │  Validate input         │                   │
    │                    │       │  Calculate cost         │                   │
    │                    │       │  INSERT waste_log       │                   │
    │                    │       │──────────────────────────>│ INSERT         │
    │                    │       │                         │────────────────>  │
    │                    │       │                         │  waste_logs      │
    │                    │       │                         │  (created)       │
    │                    │       │                         │                   │
    │                    │       │                         │  TRIGGER fires:   │
    │                    │       │                         │  create_waste_    │
    │                    │       │                         │  inventory_       │
    │                    │       │                         │  movement()       │
    │                    │       │                         │                   │
    │                    │       │                         │  INSERT inventory_│
    │                    │       │                         │────────────────>  │
    │                    │       │                         │  movements        │
    │                    │       │                         │  (spoilage)       │
    │                    │       │                         │                   │
    │                    │       │                         │  UPDATE ingredients
    │                    │       │                         │────────────────>  │
    │                    │       │                         │  (decrement stock)│
    │                    │       │                         │                   │
    │                    │       │                         │  TRIGGER fires:   │
    │                    │       │                         │  update_waste_    │
    │                    │       │                         │  statistics()     │
    │                    │       │                         │                   │
    │                    │       │                         │  UPDATE waste_    │
    │                    │       │                         │────────────────>  │
    │                    │       │                         │  statistics       │
    │                    │       │                         │  (daily totals)   │
    │                    │       │                         │                   │
    │                    │<──── Success Response ─────────│                   │
    │                    │       │         + WasteLog      │                   │
    │                    │       │                         │                   │
    │<── Show success & modal closes ─                     │                   │
    │<── Notification: "Waste reported" ─                  │                   │
    │                    │       │                         │                   │
    │                    │  Auto-refresh waste dashboard   │                   │
    │                    │─────────────────────────────────>│  Fetch latest    │
    │                    │       │      GET /api/waste/     │────────────────>  │
    │                    │       │      reports             │  waste_logs      │
    │                    │<────────── Reports + Stats ─────│<────────────────  │
    │                    │       │                         │                   │
    │<── Waste reports updated in UI ─                     │                   │
    │
```

### Scenario 2: Manager Resolves Waste Report

```
Manager                    Frontend                Backend              Database
    │                           │                         │                   │
    │─── View Waste Dashboard ──>│                         │                   │
    │                    │  GET /api/waste/reports (unresolved)              │
    │                    │─────────────────────────────────>│                   │
    │                    │       │                         │                   │
    │                    │       │  SELECT * FROM waste_logs                  │
    │                    │       │────────────────────────>  │
    │                    │       │  WHERE is_resolved = false│
    │                    │<────────── List of reports ──────│<───────────────  │
    │                    │       │                         │  Unresolved      │
    │                    │       │                         │  reports         │
    │<── See unresolved reports ─                          │                   │
    │                    │       │                         │                   │
    │─── Click "Resolve" on report ─                       │                   │
    │                    │       │                         │                   │
    │                    │  Open resolve form/modal        │                   │
    │                    │       │                         │                   │
    │─── Add notes & click "Resolve" ─                     │                   │
    │                    │       │                         │                   │
    │                    │  PUT /api/waste/reports/:id/resolve              │
    │                    │─────────────────────────────────>│                   │
    │                    │       │                         │                   │
    │                    │       │  UPDATE waste_logs      │                   │
    │                    │       │  SET is_resolved=true   │                   │
    │                    │       │  manager_notes=...      │────────────────>  │
    │                    │       │  resolved_at=NOW()      │  (updated)       │
    │                    │       │                         │                   │
    │                    │       │  INSERT INTO waste_     │                   │
    │                    │       │  audit_log (action='    │────────────────>  │
    │                    │       │  resolved')             │  Audit trail     │
    │                    │       │                         │                   │
    │                    │<────────── Success Response ────│                   │
    │                    │       │                         │                   │
    │<── Show success & remove from list ─                 │                   │
    │<── Notification: "Report resolved" ─                 │                   │
    │                    │       │                         │                   │
    │                    │  Refresh dashboard/fetch updated stats             │
    │                    │─────────────────────────────────>│                   │
```

### Scenario 3: Export Waste Report

```
Manager/Admin              Frontend                Backend              File System
    │                           │                         │                   │
    │─── Select date range ────>│                         │                   │
    │─── Click "Export Excel" ──>│                         │                   │
    │                    │       │                         │                   │
    │                    │  GET /api/waste/export         │                   │
    │                    │  ?format=excel                 │                   │
    │                    │  &from_date=...               │                   │
    │                    │  &to_date=...                 │                   │
    │                    │─────────────────────────────────>│                   │
    │                    │       │                         │                   │
    │                    │       │  SELECT * FROM waste_logs                  │
    │                    │       │────────────────────────>  │
    │                    │       │  WHERE date BETWEEN ... AND ...            │
    │                    │       │                         │  Fetch reports   │
    │                    │       │  JOIN ingredients       │<───────────────  │
    │                    │       │  for ingredient names   │  Report data     │
    │                    │       │                         │                   │
    │                    │       │  SELECT * FROM waste_   │                   │
    │                    │       │  statistics             │────────────────>  │
    │                    │       │────────────────────────>  │
    │                    │       │                         │  Statistics      │
    │                    │       │  Generate Excel file:   │<───────────────  │
    │                    │       │  - Headers              │                   │
    │                    │       │  - Report rows          │                   │
    │                    │       │  - Summary sheet        │                   │
    │                    │       │  - Charts (embedded)    │                   │
    │                    │       │                         │                   │
    │                    │<────────────── Excel file ──────│                   │
    │                    │       │  (as binary stream)     │                   │
    │                    │       │                         │                   │
    │<── Download starts ────────│                         │                   │
    │                    │       │  Browser saves file     │                   │
    │<── waste_report_2025_11_13.xlsx ──                   │                   │
    │                           │                         │                   │
```

---

## 🧬 Component Hierarchy

```
App
├── KitchenDashboard
│   ├── Header
│   │   ├── Title
│   │   ├── Keyboard Shortcuts Help
│   │   ├── Refresh Button
│   │   └── Report Waste Button ◄─── NEW
│   │
│   ├── Tabs Navigation
│   │   ├── Orders Tab
│   │   ├── Inventory Tab
│   │   ├── Equipment Tab
│   │   └── Waste & Spoilage Tab ◄─── NEW
│   │
│   ├── TabContent
│   │   ├── Orders Content
│   │   ├── Inventory Content
│   │   ├── Equipment Content
│   │   └── WasteDashboardTab ◄─── NEW
│   │       ├── Summary Stats
│   │       │   ├── StatCard (Today's Waste)
│   │       │   ├── StatCard (Weekly Waste)
│   │       │   ├── StatCard (Monthly Waste)
│   │       │   └── StatCard (Top Ingredient)
│   │       │
│   │       ├── Filters & Controls
│   │       │   ├── Search Box (ingredient)
│   │       │   ├── Date Range Picker
│   │       │   ├── Reason Filter
│   │       │   ├── Shift Filter
│   │       │   └── Export Button
│   │       │
│   │       ├── Reports List
│   │       │   ├── Table Header
│   │       │   └── WasteReportCard[] ◄─── NEW (repeating)
│   │       │       ├── Ingredient Info
│   │       │       ├── Waste Type Badge
│   │       │       ├── Quantity Display
│   │       │       ├── Cost Display
│   │       │       ├── Reported By
│   │       │       ├── Timestamp
│   │       │       ├── Status Badge
│   │       │       └── Resolve Button
│   │       │
│   │       ├── Charts Section
│   │       │   ├── PieChart (Waste by Type)
│   │       │   ├── BarChart (Top Ingredients)
│   │       │   ├── BarChart (By Reason)
│   │       │   └── LineChart (Daily Trend)
│   │       │
│   │       └── Pagination
│   │           ├── Previous Button
│   │           ├── Page Numbers
│   │           └── Next Button
│   │
│   └── Modals
│       ├── WasteReportModal ◄─── NEW
│       │   ├── Form
│       │   │   ├── IngredientSelector
│       │   │   ├── WasteTypeSelector
│       │   │   ├── QuantityInput
│       │   │   ├── ReasonSelector
│       │   │   ├── LocationSelector
│       │   │   ├── ShiftSelector
│       │   │   ├── DescriptionTextarea
│       │   │   └── CostDisplay (readonly)
│       │   │
│       │   └── Actions
│       │       ├── Cancel Button
│       │       └── Submit Button
│       │
│       ├── WasteResolveModal ◄─── NEW (Manager)
│       │   ├── Report Details
│       │   ├── Manager Notes Textarea
│       │   └── Resolve Button
│       │
│       └── ExportModal ◄─── NEW
│           ├── Format Selector (Excel/PDF)
│           ├── Date Range Picker
│           └── Export Button

```

---

## 🗄️ Database Relationships

```
┌──────────────────────────────┐
│      restaurants (existing)  │
│  ┌─────────────────────────┐ │
│  │ id (PK)                 │ │
│  │ name                    │ │
│  │ ...                     │ │
│  └─────────────────────────┘ │
└──────────────┬───────────────┘
               │ (1)
               │ (1..*)
        ┌──────▼──────────────────────────┐
        │    waste_logs (NEW)             │
        │  ┌────────────────────────────┐ │
        │  │ id (PK)                    │ │
        │  │ restaurant_id (FK)         │ │
        │  │ ingredient_id (FK)         │ │◄────┐
        │  │ waste_type                 │ │     │
        │  │ quantity_wasted            │ │     │
        │  │ unit                       │ │     │
        │  │ reason                     │ │     │
        │  │ reported_by_user_id (FK)   │ │     │
        │  │ is_resolved                │ │     │
        │  │ estimated_cost             │ │     │
        │  │ created_at                 │ │     │
        │  └────────────────────────────┘ │     │
        └────────────────────────────────┘      │
               │                                 │
               │ (1..*)                    (1)  │
               │                                 │
        ┌──────▼──────────────────────────┐     │
        │  waste_audit_log (NEW)          │     │
        │  ┌────────────────────────────┐ │     │
        │  │ id (PK)                    │ │     │
        │  │ waste_log_id (FK)          │ │     │
        │  │ action                     │ │     │
        │  │ action_by_user_id (FK)     │ │     │
        │  │ action_timestamp           │ │     │
        │  │ old_values (JSONB)         │ │     │
        │  │ new_values (JSONB)         │ │     │
        │  └────────────────────────────┘ │     │
        └─────────────────────────────────┘     │
                                                 │
        ┌─────────────────────────────────────────┘
        │
        │ (1..*)
        │
┌───────▼────────────────────────┐
│  ingredients (existing)        │
│  ┌────────────────────────────┐│
│  │ id (PK)                    ││
│  │ restaurant_id (FK)         ││
│  │ name                       ││
│  │ current_stock              ││
│  │ min_stock_threshold        ││
│  │ cost_per_unit              ││
│  │ unit                       ││
│  └────────────────────────────┘│
└────────────────────────────────┘

           │ (1..*)
           │
┌──────────▼──────────────────────────┐
│  inventory_movements (existing)     │
│  ┌────────────────────────────────┐ │
│  │ id (PK)                        │ │
│  │ ingredient_id (FK)             │ │
│  │ movement_type (e.g., spoilage) │ │
│  │ quantity_moved                 │ │
│  │ reference_id (waste_log.id)    │ │
│  │ reference_type (waste_log)     │ │
│  │ created_at                     │ │
│  └────────────────────────────────┘ │
└────────────────────────────────────┘

┌──────────────────────────────────────┐
│  waste_categories (NEW)              │
│  ┌────────────────────────────────┐  │
│  │ id (PK)                        │  │
│  │ restaurant_id (FK)             │  │
│  │ category_name                  │  │
│  │ category_type                  │  │
│  │ target_waste_percentage        │  │
│  │ is_active                      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
        │
        │ (0..1)
        │
        └─► waste_logs (optional association)

┌──────────────────────────────────────┐
│  waste_statistics (NEW)              │
│  ┌────────────────────────────────┐  │
│  │ id (PK)                        │  │
│  │ restaurant_id (FK)             │  │
│  │ date_recorded                  │  │
│  │ total_waste_quantity           │  │
│  │ total_waste_cost               │  │
│  │ spoilage_quantity              │  │
│  │ spillage_quantity              │  │
│  │ waste_count                    │  │
│  │ top_wasted_ingredient_id       │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────┐
│         Authentication (JWT Token)              │
│  User → Login → Token → Include in all requests │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────▼────────────────────┐
        │   Authorization Layer       │
        │  (Check user's role)        │
        ├────────────────────────────┤
        │ Kitchen Staff:              │
        │ ✓ Report waste              │
        │ ✓ View own reports          │
        │ ✗ Resolve/Edit reports      │
        │ ✗ Delete reports            │
        │ ✗ Export data               │
        │                             │
        │ Manager:                    │
        │ ✓ Report waste              │
        │ ✓ View all reports          │
        │ ✓ Edit/Resolve reports      │
        │ ✓ Export data               │
        │ ✗ Delete reports            │
        │ ✗ Manage categories         │
        │                             │
        │ Admin:                      │
        │ ✓ All permissions           │
        │ ✓ Delete reports            │
        │ ✓ Manage categories         │
        │ ✓ Access audit logs         │
        └────────────────────────────┘
                 │
        ┌────────▼────────────────────┐
        │   Row-Level Security (RLS)  │
        │   (Database level)          │
        ├────────────────────────────┤
        │ Users can only see/edit     │
        │ waste logs from their       │
        │ assigned restaurant         │
        └────────────────────────────┘
                 │
        ┌────────▼────────────────────┐
        │   Input Validation          │
        │  (Backend & Frontend)       │
        ├────────────────────────────┤
        │ • Quantity > 0              │
        │ • Unit valid enum           │
        │ • Reason valid enum         │
        │ • Cost calculated server-   │
        │   side (not trusted client) │
        │ • XSS protection            │
        │ • SQL injection prevention  │
        └────────────────────────────┘
```

---

## 📤 API Request/Response Format

### POST /api/waste/report

```
Request:
{
  "ingredient_id": "uuid-string",
  "waste_type": "spoilage|spillage|other",
  "quantity_wasted": 5.5,
  "unit": "kg",
  "reason": "expired|damaged_container|dropped|discolored|odor|other",
  "description": "Vegetables turned brown, likely oxidation",
  "location_in_kitchen": "Fridge",
  "shift": "morning|afternoon|night"
}

Response (Success 200):
{
  "success": true,
  "message": "Waste reported successfully",
  "data": {
    "id": "waste-uuid",
    "ingredient_id": "uuid",
    "waste_type": "spoilage",
    "quantity_wasted": 5.5,
    "unit": "kg",
    "reason": "expired",
    "estimated_cost": 137.50,
    "reported_by_name": "John Smith",
    "timestamp_reported": "2025-11-13T10:30:00Z",
    "is_resolved": false,
    "created_at": "2025-11-13T10:30:00Z"
  }
}

Response (Error 400):
{
  "success": false,
  "message": "Validation error",
  "error": "Quantity must be greater than 0"
}
```

### GET /api/waste/reports

```
Request:
GET /api/waste/reports?page=1&limit=20&ingredient_id=&reason=&from_date=&to_date=&shift=

Response (Success 200):
{
  "success": true,
  "message": "Waste reports retrieved",
  "data": [
    {
      "id": "waste-uuid",
      "ingredient_id": "uuid",
      "ingredient_name": "Carrot",
      "waste_type": "spoilage",
      "quantity_wasted": 5.5,
      "unit": "kg",
      "reason": "expired",
      "reported_by_name": "John Smith",
      "timestamp_reported": "2025-11-13T10:30:00Z",
      "estimated_cost": 137.50,
      "is_resolved": false
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  },
  "stats": {
    "total_waste_today": 45.2,
    "total_cost_today": 892.50,
    "total_waste_week": 285.0,
    "total_cost_week": 5625.00,
    "most_wasted_ingredient": "Carrot"
  }
}
```

---

## 🔍 Audit & Compliance

```
┌────────────────────────────────────────────────────┐
│   Waste Audit Log (waste_audit_log table)          │
├────────────────────────────────────────────────────┤
│                                                    │
│  Every action logged:                              │
│  1. Create waste report → INSERT audit_log         │
│  2. Manager resolves → INSERT audit_log            │
│  3. Edit report → INSERT audit_log + JSON delta    │
│  4. Delete report → INSERT audit_log (soft delete) │
│                                                    │
│  Audit Trail Shows:                                │
│  • Who made the action (user_id, name)            │
│  • What action (created/updated/resolved/deleted)  │
│  • When (action_timestamp)                        │
│  • Before/after values (old_values, new_values)   │
│  • Why (notes/reason for the action)              │
│                                                    │
│  Never deleted → Full compliance history          │
│  Soft deletes only → Data recovery possible       │
└────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────┐
│         Development Environment            │
│  - Local database                          │
│  - Test waste data                         │
│  - Mock API responses                      │
└────────────────────────────────────────────┘
                    │
                    │ Deploy
                    │
┌────────────────────────────────────────────┐
│         Staging Environment                │
│  - Staging database (copy of prod)         │
│  - Real API endpoints                      │
│  - Real authentication                     │
│  - QA testing                              │
└────────────────────────────────────────────┘
                    │
                    │ Promote
                    │
┌────────────────────────────────────────────┐
│      Production Environment (Live)         │
│  - Production PostgreSQL                   │
│  - Real waste data                         │
│  - Real users                              │
│  - Backups enabled                         │
│  - Monitoring enabled                      │
│  - Audit logs enabled                      │
└────────────────────────────────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Architecture Status:** Ready for Implementation
