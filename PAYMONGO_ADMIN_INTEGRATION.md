# PayMongo Admin Integration

This document describes the PayMongo payment management system integrated into the admin dashboard.

## Overview

The PayMongo admin integration provides comprehensive payment monitoring and management capabilities for restaurant administrators. It allows viewing all PayMongo payment transactions, their statuses, and detailed information.

## Features

### 1. Payment Dashboard
- **Statistics Overview**: Total payments, successful payments, pending payments, failed payments, and total amount
- **Real-time Status Monitoring**: Live updates of payment statuses
- **Search & Filter**: Search by payment ID, order number, customer name, or phone number
- **Status Filtering**: Filter by payment status (awaiting_payment_method, processing, succeeded, etc.)

### 2. Payment Management
- **Payment Details Modal**: Comprehensive view of payment information
- **Order Information**: Linked order details and customer information
- **Payment Status Tracking**: Real-time status updates with visual indicators
- **Copy Functions**: Copy payment IDs and order IDs to clipboard

### 3. Admin Controls
- **Refresh Data**: Manual refresh of payment data
- **Export Functionality**: Export payment data (CSV, Excel, PDF)
- **Bulk Operations**: Future support for bulk payment operations

## Components

### 1. PayMongoPaymentManagement.tsx
Main component for the PayMongo payments admin interface.

**Location**: `src/components/PayMongo/PayMongoPaymentManagement.tsx`

**Features**:
- Payment list with search and filtering
- Statistics cards
- Payment details modal
- Responsive design

### 2. usePayMongoAdmin.ts
Custom hook for PayMongo payment management logic.

**Location**: `src/hooks/usePayMongoAdmin.ts`

**Features**:
- State management for payments
- API integration functions
- Utility functions (formatting, status handling)
- Mock data for development

### 3. paymongoApi.ts
API utility functions for PayMongo integration.

**Location**: `src/utils/paymongoApi.ts`

**Features**:
- API endpoint definitions
- Type definitions
- Example usage patterns

## API Integration

### Endpoints Used

1. **GET /api/payments/status/:paymentIntentId**
   - Fetches payment status for a specific payment intent
   - Returns detailed payment information including metadata

2. **GET /api/paymongo/payments** (Future)
   - Fetches all PayMongo payments with pagination
   - Supports filtering by status, date range, etc.

3. **GET /api/paymongo/stats** (Future)
   - Returns payment statistics and analytics

4. **POST /api/payments/cancel/:paymentIntentId**
   - Cancels a specific payment intent

### Sample API Response

```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_EostntdQe4tS6TP1fEFFCvA8",
    "status": "awaiting_next_action",
    "amount": 4704,
    "currency": "PHP",
    "description": "Payment for Order #ORD-20250910-0001",
    "metadata": {
      "orderId": "40387a08-cc0f-42cd-94bc-c16835123399",
      "timestamp": "2025-09-10T12:09:49.354Z",
      "customer_phone": "39437845",
      "orderNumber": "ORD-20250910-0001",
      "customerName": "test",
      "createdBy": "3208eac9-bd2d-407d-a5cb-1887b9d154c8",
      "orderType": "dine_in",
      "createdByUsername": "cashier1",
      "order_type": "dine_in"
    },
    "created_at": 1757506189,
    "updated_at": 1757506190
  }
}
```

## Payment Statuses

The system handles the following PayMongo payment statuses:

- **awaiting_payment_method**: Waiting for customer to scan QR code
- **awaiting_next_action**: Customer selected payment method, waiting for completion
- **processing**: Payment is being processed
- **succeeded**: Payment completed successfully ✅
- **cancelled**: Payment was cancelled ❌
- **failed**: Payment failed ❌

## Navigation Integration

### Admin Sidebar
The PayMongo payments section is integrated into the admin sidebar:

**Location**: `src/components/Layout/Sidebar.tsx`

```typescript
{ id: 'paymongo', label: 'PayMongo Payments', icon: CreditCard }
```

### Admin Layout
The PayMongo component is integrated into the admin layout routing:

**Location**: `src/components/Layout/AdminLayout.tsx`

```typescript
case 'paymongo':
  return <PayMongoPaymentManagement />;
```

## Usage

### Accessing PayMongo Payments
1. Log in as an admin user
2. Navigate to the admin dashboard
3. Click on "PayMongo Payments" in the sidebar
4. View and manage all PayMongo payment transactions

### Viewing Payment Details
1. Click the "View Details" button (eye icon) for any payment
2. View comprehensive payment information including:
   - Payment status and history
   - Order details and customer information
   - Payment method information
   - Timestamps and metadata

### Searching and Filtering
1. Use the search bar to find payments by:
   - Payment Intent ID
   - Order number
   - Customer name
   - Customer phone number
2. Use the status filter to show only payments with specific statuses

## Development Notes

### Mock Data
Currently using mock data for development. To integrate with real API:

1. Update `usePayMongoAdmin.ts` to use real API calls
2. Replace mock data with actual API responses
3. Implement proper error handling for API failures

### Future Enhancements
- Real-time WebSocket updates for payment status changes
- Bulk payment operations (cancel, refund)
- Advanced filtering and date range selection
- Payment analytics and reporting
- Export functionality for payment data

## Security Considerations

- Admin-only access to payment information
- Secure API endpoints with proper authentication
- No sensitive payment data stored in frontend
- Proper error handling to prevent information leakage

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Custom API utilities

## File Structure

```
src/
├── components/
│   ├── PayMongo/
│   │   └── PayMongoPaymentManagement.tsx
│   └── Layout/
│       ├── AdminLayout.tsx
│       └── Sidebar.tsx
├── hooks/
│   └── usePayMongoAdmin.ts
└── utils/
    ├── api.ts
    └── paymongoApi.ts
```

This integration provides a comprehensive solution for managing PayMongo payments within the restaurant admin system, offering real-time monitoring, detailed payment information, and administrative controls.
