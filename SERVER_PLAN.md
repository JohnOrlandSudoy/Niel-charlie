# Server Implementation Plan

## 🚀 **Backend Architecture Overview**

This document outlines the complete server implementation plan for the adminRestu restaurant management system using **Node.js**, **Express.js**, and **Supabase** as the database.

---

## 🏗️ **Technology Stack**

### **Backend Framework**
- **Node.js 18+** - Runtime environment
- **Express.js 4.18+** - Web framework
- **TypeScript 5.0+** - Type safety and development experience

### **Database & Authentication**
- **Supabase** - PostgreSQL database with real-time features
- **Supabase Auth** - Authentication and authorization
- **Row Level Security (RLS)** - Database-level security

### **Additional Tools**
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **joi** - Request validation
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **morgan** - HTTP request logging

---

## 📊 **Database Schema Design**

### **1. Users Table (Supabase Auth Extension)**
```sql
-- Extends Supabase Auth
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'kitchen', 'inventory_manager');
```

### **2. Ingredients Table**
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  cost_per_unit DECIMAL(10,2),
  supplier VARCHAR(100),
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. Menu Items Table**
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image_url VARCHAR(255),
  prep_time INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **4. Menu Item Ingredients (Junction Table)**
```sql
CREATE TABLE menu_item_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menu_item_id, ingredient_id)
);
```

### **5. Menu Item Customizations**
```sql
CREATE TABLE menu_item_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **6. Menu Item Add-ons**
```sql
CREATE TABLE menu_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **7. Customers Table**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **8. Orders Table**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  order_type order_type NOT NULL DEFAULT 'dine_in',
  status order_status NOT NULL DEFAULT 'pending',
  priority order_priority NOT NULL DEFAULT 'medium',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  payment_method payment_method,
  table_number INTEGER,
  special_instructions TEXT,
  estimated_ready_time TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enums
CREATE TYPE order_type AS ENUM ('dine_in', 'takeout');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE order_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'card');
```

### **9. Order Items Table**
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  menu_item_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  customizations JSONB DEFAULT '[]',
  addons JSONB DEFAULT '[]',
  special_instructions TEXT,
  status order_item_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE order_item_status AS ENUM ('pending', 'preparing', 'ready');
```

### **10. Inventory Transactions**
```sql
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  transaction_type transaction_type NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  reason VARCHAR(100),
  reference_id UUID, -- Order ID or other reference
  reference_type VARCHAR(50), -- 'order', 'adjustment', 'delivery'
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE transaction_type AS ENUM ('in', 'out', 'adjustment');
```

### **11. Employee Time Tracking**
```sql
CREATE TABLE employee_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES user_profiles(id),
  date DATE NOT NULL,
  time_in TIMESTAMP WITH TIME ZONE,
  time_out TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4,2),
  status time_log_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE time_log_status AS ENUM ('active', 'completed', 'cancelled');
```

### **12. System Logs**
```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 **Row Level Security (RLS) Policies**

### **User Profiles**
```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### **Orders**
```sql
-- Cashiers can view and manage orders
CREATE POLICY "Cashiers can manage orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'cashier')
    )
  );

-- Kitchen staff can view orders
CREATE POLICY "Kitchen can view orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'kitchen')
    )
  );
```

---

## 🏗️ **Server Architecture**

### **Project Structure**
```
server/
├── src/
│   ├── config/
│   │   ├── database.ts          # Supabase configuration
│   │   ├── auth.ts              # Authentication config
│   │   └── environment.ts       # Environment variables
│   ├── controllers/
│   │   ├── authController.ts    # Authentication logic
│   │   ├── orderController.ts   # Order management
│   │   ├── menuController.ts    # Menu management
│   │   ├── inventoryController.ts # Inventory management
│   │   └── userController.ts    # User management
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── roleCheck.ts         # Role-based access
│   │   ├── validation.ts        # Request validation
│   │   └── errorHandler.ts      # Error handling
│   ├── routes/
│   │   ├── auth.ts              # Authentication routes
│   │   ├── orders.ts            # Order routes
│   │   ├── menu.ts              # Menu routes
│   │   ├── inventory.ts         # Inventory routes
│   │   └── users.ts             # User routes
│   ├── services/
│   │   ├── supabaseService.ts   # Database operations
│   │   ├── orderService.ts      # Order business logic
│   │   ├── inventoryService.ts  # Inventory business logic
│   │   └── notificationService.ts # Real-time notifications
│   ├── types/
│   │   ├── auth.ts              # Authentication types
│   │   ├── order.ts             # Order types
│   │   ├── menu.ts              # Menu types
│   │   └── inventory.ts         # Inventory types
│   ├── utils/
│   │   ├── logger.ts            # Logging utility
│   │   ├── validation.ts        # Validation schemas
│   │   └── helpers.ts           # Helper functions
│   └── app.ts                   # Express app setup
├── package.json
├── tsconfig.json
└── .env
```

---

## 🔌 **API Endpoints**

### **Authentication Routes**
```typescript
// POST /api/auth/login
// POST /api/auth/register
// POST /api/auth/logout
// GET /api/auth/profile
// PUT /api/auth/profile
// POST /api/auth/refresh-token
```

### **Order Routes**
```typescript
// GET /api/orders - List orders with filters
// POST /api/orders - Create new order
// GET /api/orders/:id - Get order details
// PUT /api/orders/:id - Update order
// DELETE /api/orders/:id - Cancel order
// PUT /api/orders/:id/status - Update order status
// GET /api/orders/search - Search orders
// POST /api/orders/:id/payment - Process payment
```

### **Menu Routes**
```typescript
// GET /api/menu - List menu items
// POST /api/menu - Create menu item
// GET /api/menu/:id - Get menu item details
// PUT /api/menu/:id - Update menu item
// DELETE /api/menu/:id - Delete menu item
// GET /api/menu/categories - List categories
// POST /api/menu/:id/ingredients - Add ingredients
// DELETE /api/menu/:id/ingredients/:ingredientId - Remove ingredient
```

### **Inventory Routes**
```typescript
// GET /api/inventory - List ingredients
// POST /api/inventory - Add ingredient
// GET /api/inventory/:id - Get ingredient details
// PUT /api/inventory/:id - Update ingredient
// DELETE /api/inventory/:id - Delete ingredient
// POST /api/inventory/:id/stock - Update stock
// GET /api/inventory/alerts - Get low stock alerts
// GET /api/inventory/transactions - Get transactions
```

### **User Management Routes**
```typescript
// GET /api/users - List users (admin only)
// POST /api/users - Create user (admin only)
// GET /api/users/:id - Get user details
// PUT /api/users/:id - Update user
// DELETE /api/users/:id - Delete user (admin only)
// POST /api/users/:id/time-in - Record time in
// POST /api/users/:id/time-out - Record time out
// GET /api/users/:id/time-logs - Get time logs
```

---

## 🔄 **Real-time Features**

### **Supabase Realtime Subscriptions**
```typescript
// Order status updates
const orderSubscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      // Handle order updates
    }
  )
  .subscribe();

// Inventory alerts
const inventorySubscription = supabase
  .channel('inventory')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'ingredients' },
    (payload) => {
      // Handle inventory updates
    }
  )
  .subscribe();
```

### **WebSocket Implementation**
```typescript
// Real-time order notifications
io.on('connection', (socket) => {
  socket.on('join-kitchen', () => {
    socket.join('kitchen');
  });
  
  socket.on('join-cashier', () => {
    socket.join('cashier');
  });
  
  socket.on('order-status-update', (data) => {
    io.to('cashier').emit('order-updated', data);
  });
});
```

---

## 🔒 **Security Implementation**

### **Authentication Middleware**
```typescript
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
```

### **Role-based Access Control**
```typescript
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.user_metadata?.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

---

## 📊 **Business Logic Implementation**

### **Order Processing Service**
```typescript
class OrderService {
  async createOrder(orderData: CreateOrderDto) {
    // 1. Validate order data
    // 2. Check ingredient availability
    // 3. Calculate totals
    // 4. Generate order number
    // 5. Create order in database
    // 6. Update inventory
    // 7. Send real-time notifications
  }
  
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    // 1. Update order status
    // 2. Update individual item statuses
    // 3. Send notifications
    // 4. Update inventory if completed
  }
}
```

### **Inventory Management Service**
```typescript
class InventoryService {
  async updateStock(ingredientId: string, quantity: number, type: 'in' | 'out') {
    // 1. Update ingredient stock
    // 2. Record transaction
    // 3. Check for low stock alerts
    // 4. Update menu availability
    // 5. Send notifications
  }
  
  async checkMenuAvailability(menuItemId: string) {
    // 1. Get required ingredients
    // 2. Check stock levels
    // 3. Return availability status
  }
}
```

---

## 🚀 **Deployment Plan**

### **Environment Setup**
```bash
# Production environment variables
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### **Docker Configuration**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **PM2 Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'adminrestu-api',
    script: 'dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

---

## 📈 **Performance Optimization**

### **Database Optimization**
- **Indexes** on frequently queried columns
- **Connection pooling** for database connections
- **Query optimization** with proper joins
- **Caching** for static data

### **API Optimization**
- **Rate limiting** to prevent abuse
- **Request validation** to reduce processing
- **Response compression** for faster transfers
- **Pagination** for large datasets

---

## 🔍 **Monitoring & Logging**

### **Application Monitoring**
```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### **Health Checks**
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await supabase.from('orders').select('count').limit(1);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

## 🔄 **Migration Strategy**

### **Phase 1: Core Setup**
1. Set up Supabase project and database
2. Create basic API structure
3. Implement authentication
4. Deploy basic endpoints

### **Phase 2: Core Features**
1. Order management system
2. Menu management
3. Basic inventory tracking
4. Real-time notifications

### **Phase 3: Advanced Features**
1. Employee time tracking
2. Advanced analytics
3. Reporting system
4. Mobile optimization

### **Phase 4: Production Ready**
1. Security hardening
2. Performance optimization
3. Monitoring and logging
4. Documentation

---

*This server plan provides a comprehensive foundation for building a robust, scalable backend for the adminRestu restaurant management system.*
