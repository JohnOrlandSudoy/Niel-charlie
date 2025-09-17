# Order Creation Test Guide

## Problem Description
When reloading the page, order items are not being displayed and all prices show as ₱0.00. The OrderDetailsModal shows "No items found for this order".

## Root Cause Analysis
The issue occurs because:
1. Order items are not being properly persisted to the database
2. Order items are not being fetched correctly after page reload
3. The order creation process may have validation issues

## Sample Data for Testing

### 1. Sample Menu Items
Use the sample data in `src/data/sampleMenuItems.ts`:

```typescript
// Available items (should appear in MenuItemSelector)
- Chicken Adobo (₱120.00) - Available
- Beef Sinigang (₱150.00) - Available  
- Pork Sisig (₱180.00) - Available
- Chicken Inasal (₱140.00) - Available (Low Stock)

// Unavailable items (should be hidden)
- Fish Sinigang (₱130.00) - Out of Stock
```

### 2. Sample Order Creation Flow
1. **Create Order**: Basic order info (customer, table, etc.)
2. **Add Items**: Select menu items with quantities
3. **Validate Stock**: Check ingredient availability
4. **Process Payment**: Choose payment method
5. **Save to Database**: Persist order and items

## Testing Steps

### Step 1: Test Menu Item Selection
1. Open Cashier Dashboard
2. Click "New Order"
3. Click "Add Item" to open MenuItemSelector
4. Verify only available items are shown
5. Select an item and add to order
6. Check that item appears in order with correct price

### Step 2: Test Order Creation
1. Fill in order details (customer name, table number)
2. Add multiple items to the order
3. Click "Create Order"
4. Check browser console for debug logs:
   ```
   🔍 [ORDER DEBUG] Starting order creation
   🔍 [ORDER DEBUG] Step 1: Order Data Validation
   🔍 [ORDER DEBUG] Step 4: Calculated Totals
   🔍 [API DEBUG] Order Creation
   🔍 [API DEBUG] Add Order Item
   ```

### Step 3: Test Page Reload
1. After creating an order, reload the page
2. Go to Cashier Dashboard
3. Click "View Details" on the created order
4. Check browser console for:
   ```
   🔍 [API DEBUG] Get Order Items
   🔍 [RELOAD DEBUG] Order items after reload
   ```

### Step 4: Verify Data Persistence
The order should show:
- ✅ Correct order items with names
- ✅ Correct quantities
- ✅ Correct prices (not ₱0.00)
- ✅ Correct total amount

## Debug Console Commands

### Check Order Items
```javascript
// In browser console
console.log('Current order items:', window.orderItems);
```

### Check API Responses
```javascript
// Check if API is working
fetch('/api/orders/ORD-20250116-0001/items')
  .then(r => r.json())
  .then(console.log);
```

### Validate Order Data
```javascript
// Check order data structure
const order = {
  id: "order-123",
  order_number: "ORD-20250116-0001",
  total_amount: 268.80,
  order_items: [
    {
      id: "order-item-1",
      menu_item_id: "menu-item-1",
      quantity: 2,
      unit_price: 120.00,
      total_price: 240.00,
      menu_items: {
        name: "Chicken Adobo",
        price: 120.00
      }
    }
  ]
};
```

## Expected API Responses

### 1. Create Order Response
```json
{
  "success": true,
  "data": {
    "id": "order-123",
    "order_number": "ORD-20250116-0001",
    "customer_name": "John Doe",
    "status": "pending",
    "payment_status": "unpaid",
    "total_amount": 0.00
  }
}
```

### 2. Add Order Item Response
```json
{
  "success": true,
  "data": {
    "id": "order-item-1",
    "order_id": "order-123",
    "menu_item_id": "menu-item-1",
    "quantity": 2,
    "unit_price": 120.00,
    "total_price": 240.00,
    "menu_items": {
      "id": "menu-item-1",
      "name": "Chicken Adobo",
      "price": 120.00
    }
  }
}
```

### 3. Get Order Items Response
```json
{
  "success": true,
  "data": [
    {
      "id": "order-item-1",
      "order_id": "order-123",
      "menu_item_id": "menu-item-1",
      "quantity": 2,
      "unit_price": 120.00,
      "total_price": 240.00,
      "menu_items": {
        "id": "menu-item-1",
        "name": "Chicken Adobo",
        "price": 120.00
      }
    }
  ]
}
```

## Common Issues & Solutions

### Issue 1: "No items found for this order"
**Cause**: Order items not being fetched from database
**Solution**: Check API endpoint `/orders/{orderId}/items`

### Issue 2: All prices show as ₱0.00
**Cause**: Order items not being properly saved with prices
**Solution**: Check order item creation API response

### Issue 3: Items disappear after page reload
**Cause**: Data not being persisted to database
**Solution**: Check database connection and API responses

### Issue 4: Menu items not showing in selector
**Cause**: Ingredient availability filtering too strict
**Solution**: Check ingredient stock levels and availability logic

## Debug Checklist

- [ ] Check browser console for debug logs
- [ ] Verify API responses are successful
- [ ] Check database for order and order_items records
- [ ] Verify ingredient stock levels
- [ ] Check authentication token is valid
- [ ] Verify order totals are calculated correctly

## Sample Test Data

Use this data to test the order creation:

```typescript
// Test order data
const testOrder = {
  order_type: "dine_in",
  customer_name: "John Doe",
  customer_phone: "09999999999",
  table_number: 1,
  special_instructions: "Please make it spicy"
};

// Test order items
const testOrderItems = [
  {
    menuItem: {
      id: "menu-item-1",
      name: "Chicken Adobo",
      price: 120.00
    },
    quantity: 2,
    customizations: "Extra spicy",
    specialInstructions: "No onions"
  }
];
```

## Next Steps

1. **Test with sample data** using the provided test cases
2. **Check console logs** for debug information
3. **Verify API responses** match expected format
4. **Test page reload** to ensure data persistence
5. **Report any issues** with specific error messages and console logs
