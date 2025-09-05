# API Integration Guide - adminRestu

## 🚀 **Fixed Authentication Integration**

Your adminRestu frontend is now properly integrated with your existing API server at `localhost:3000`.

---

## ✅ **What's Fixed**

### **1. Updated AuthContext**
- Now uses your existing API server instead of Supabase directly
- Properly handles JWT tokens from your API
- Stores authentication data in localStorage
- Maintains session persistence

### **2. API Utility Functions (`src/utils/api.ts`)**
- Centralized API request handling
- Automatic token attachment to requests
- Error handling for unauthorized requests
- Ready-to-use API endpoints for all features

### **3. Authentication Flow**
- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`
- Automatic token management
- Session persistence across browser refreshes

---

## 🧪 **Testing Your Authentication**

### **Step 1: Start Your API Server**
Make sure your API server is running on `localhost:3000`

### **Step 2: Test Login**
1. Start your React app: `npm run dev`
2. Go to `/signin`
3. Use the credentials that work in Postman:
   - Username: `newadmin`
   - Password: `password123`

### **Step 3: Verify Success**
You should see:
- Successful login
- Redirect to admin dashboard
- User data displayed correctly
- Session persists on page refresh

---

## 🔧 **API Endpoints Available**

Your frontend now has access to these API endpoints:

### **Authentication**
```typescript
// Login
const response = await api.auth.login({ username, password });

// Register
const response = await api.auth.register(userData);

// Logout
const response = await api.auth.logout();
```

### **Menu Management**
```typescript
// Get all menu items
const response = await api.menu.getItems();

// Create menu item
const response = await api.menu.createItem(menuData);

// Update menu item
const response = await api.menu.updateItem(id, menuData);
```

### **Order Management**
```typescript
// Get all orders
const response = await api.orders.getOrders();

// Create order
const response = await api.orders.createOrder(orderData);

// Update order status
const response = await api.orders.updateOrder(id, { status: 'preparing' });
```

### **Inventory Management**
```typescript
// Get ingredients
const response = await api.inventory.getIngredients();

// Create stock movement
const response = await api.inventory.createStockMovement(movementData);
```

---

## 🔐 **Authentication Token Handling**

### **Automatic Token Management**
- Tokens are automatically attached to API requests
- Stored securely in localStorage
- Automatically cleared on logout
- Redirects to login on 401 errors

### **Token Usage**
```typescript
// The API utility automatically adds the token:
// Authorization: Bearer <your-jwt-token>

const response = await api.orders.getOrders();
```

---

## 🛠️ **Using the API in Components**

### **Example: Fetching Orders**
```typescript
import { api } from '../utils/api';

const OrdersComponent = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.orders.getOrders();
        const data = await response.json();
        setOrders(data.orders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  );
};
```

### **Example: Creating an Order**
```typescript
const createOrder = async (orderData) => {
  try {
    const response = await api.orders.createOrder(orderData);
    const result = await response.json();
    
    if (result.success) {
      console.log('Order created:', result.data);
    }
  } catch (error) {
    console.error('Failed to create order:', error);
  }
};
```

---

## 🔄 **Data Flow**

### **Login Process**
1. User enters credentials
2. Frontend calls `POST /api/auth/login`
3. API returns JWT token and user data
4. Token stored in localStorage
5. User redirected to dashboard

### **API Requests**
1. Component calls API utility function
2. Token automatically attached to request
3. API processes request with authentication
4. Response returned to component

### **Logout Process**
1. User clicks logout
2. Token removed from localStorage
3. User redirected to login page

---

## 🚨 **Error Handling**

### **Authentication Errors**
- 401 Unauthorized: Token cleared, redirect to login
- Invalid credentials: Error message displayed
- Network errors: Generic error message

### **API Errors**
- All API calls include error handling
- Failed requests show appropriate messages
- Network issues are handled gracefully

---

## 📱 **Component Integration**

### **Update Existing Components**
You can now update your existing components to use real API data:

```typescript
// Before (mock data)
const [orders] = useState(mockOrders);

// After (real API data)
const [orders, setOrders] = useState([]);

useEffect(() => {
  const fetchOrders = async () => {
    const response = await api.orders.getOrders();
    const data = await response.json();
    setOrders(data.orders);
  };
  fetchOrders();
}, []);
```

---

## 🎯 **Next Steps**

### **Immediate Actions**
1. ✅ Test login with your existing credentials
2. ✅ Verify dashboard loads correctly
3. ✅ Test session persistence

### **Future Enhancements**
1. Update dashboard components to use real API data
2. Implement real-time updates with WebSockets
3. Add error boundaries for better error handling
4. Implement loading states for better UX

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Issue: "Failed to fetch"**
- Solution: Ensure your API server is running on localhost:3000
- Check CORS settings in your API server

**Issue: "401 Unauthorized"**
- Solution: Check if token is being sent correctly
- Verify token format in your API server

**Issue: "Network Error"**
- Solution: Check API server status
- Verify endpoint URLs are correct

---

## 🎉 **Success!**

Your adminRestu frontend is now properly integrated with your API server. You can:

- ✅ Login with existing credentials
- ✅ Access all API endpoints
- ✅ Maintain authentication state
- ✅ Build features with real data

**Ready to build amazing restaurant management features!** 🚀
