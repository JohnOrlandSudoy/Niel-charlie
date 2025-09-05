# Supabase Authentication Implementation Guide

## 🚀 **Complete Supabase Integration for adminRestu**

This guide provides step-by-step instructions for implementing Supabase authentication in your adminRestu project.

---

## 📋 **What We've Implemented**

### **✅ Completed Tasks**
1. **Supabase Client Setup** - `src/lib/supabase.ts`
2. **Updated AuthContext** - Real Supabase authentication
3. **Updated SignIn Component** - Username/Email login support
4. **Updated SignUp Component** - Supabase user registration
5. **Complete Database Schema** - `SUPABASE_COMPLETE_SCHEMA.sql`

---

## 🗄️ **Database Setup**

### **Step 1: Run the SQL Schema**
1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `SUPABASE_COMPLETE_SCHEMA.sql`
4. Click **Run** to execute the schema

### **Step 2: Verify Tables Created**
The schema creates these tables:
- `user_profiles` - User information
- `menu_categories` - Menu categories
- `ingredients` - Inventory ingredients
- `menu_items` - Restaurant menu items
- `orders` - Customer orders
- `order_items` - Order line items
- `stock_movements` - Inventory tracking
- `stock_alerts` - Low stock notifications
- `discounts` - Promotional discounts
- And more...

---

## 🔐 **Authentication Flow**

### **Login Process**
1. User enters username/email and password
2. System looks up email from username in `user_profiles`
3. Supabase Auth authenticates with email/password
4. User profile is fetched and stored in context
5. User is redirected to appropriate dashboard

### **Registration Process**
1. User fills out registration form
2. System checks for existing username/email
3. Supabase Auth creates new user account
4. User profile is created in `user_profiles` table
5. User is automatically logged in

---

## 🛠️ **API Endpoints**

Your Supabase setup provides these endpoints:

### **Authentication Endpoints**
```
POST https://italcjeomaybmbabgmmq.supabase.co/auth/v1/signup
POST https://italcjeomaybmbabgmmq.supabase.co/auth/v1/token?grant_type=password
POST https://italcjeomaybmbabgmmq.supabase.co/auth/v1/logout
```

### **Database Endpoints**
```
GET https://italcjeomaybmbabgmmq.supabase.co/rest/v1/user_profiles
GET https://italcjeomaybmbabgmmq.supabase.co/rest/v1/orders
GET https://italcjeomaybmbabgmmq.supabase.co/rest/v1/menu_items
```

---

## 👥 **User Roles & Permissions**

### **Admin Role**
- Full access to all features
- User management
- Menu management
- Inventory management
- Order management
- Analytics and reports

### **Cashier Role**
- Order creation and management
- Payment processing
- Customer service
- View menu items
- Basic inventory visibility

### **Kitchen Role**
- View orders
- Update order status
- View menu items
- Inventory alerts
- Order preparation tracking

### **Inventory Manager Role**
- Inventory management
- Stock movements
- Supplier management
- Stock alerts
- Cost tracking

---

## 🔧 **Configuration**

### **Environment Variables**
The Supabase configuration is hardcoded in `src/lib/supabase.ts`:
```typescript
const supabaseUrl = 'https://italcjeomaybmbabgmmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### **Row Level Security (RLS)**
The schema includes RLS policies for:
- Users can only view their own profile
- Admins can view all profiles
- Kitchen staff can view all orders
- Cashiers can create orders
- Inventory managers can manage ingredients

---

## 🧪 **Testing the Implementation**

### **Step 1: Create Test Users**
1. Start your development server: `npm run dev`
2. Navigate to `/signup`
3. Create test accounts for each role:
   - Admin: admin@restaurant.com
   - Cashier: cashier@restaurant.com
   - Kitchen: kitchen@restaurant.com

### **Step 2: Test Login**
1. Navigate to `/signin`
2. Try logging in with:
   - Username: `admin` (or email: `admin@restaurant.com`)
   - Password: `admin123`

### **Step 3: Verify Role-Based Access**
- Admin should see full dashboard
- Cashier should see cashier dashboard
- Kitchen should see kitchen dashboard

---

## 📱 **Frontend Integration**

### **AuthContext Usage**
```typescript
const { user, login, signup, logout, isLoading, isAuthenticated } = useAuth();

// Login
const result = await login({ username: 'admin', password: 'admin123' });

// Signup
const result = await signup({
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john@example.com',
  password: 'password123',
  role: 'cashier'
});

// Logout
await logout();
```

### **Protected Routes**
```typescript
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

---

## 🔄 **Real-time Features**

### **Supabase Realtime**
The schema supports real-time updates for:
- Order status changes
- Stock level updates
- New orders
- Menu item availability

### **WebSocket Connection**
```typescript
// Listen to order changes
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order updated:', payload);
    }
  )
  .subscribe();
```

---

## 🚨 **Error Handling**

### **Common Errors**
1. **Invalid credentials** - Check username/email and password
2. **User not found** - Verify user exists in `user_profiles`
3. **Email already exists** - Use different email for registration
4. **Username already exists** - Use different username

### **Debug Mode**
Enable console logging by checking browser developer tools for detailed error messages.

---

## 🔒 **Security Features**

### **Implemented Security**
- ✅ Row Level Security (RLS) policies
- ✅ JWT token authentication
- ✅ Password hashing (Supabase handles this)
- ✅ Session management
- ✅ Role-based access control

### **Additional Security Recommendations**
- Enable email verification for production
- Implement password reset functionality
- Add rate limiting for login attempts
- Use HTTPS in production
- Regular security audits

---

## 📊 **Sample Data**

The schema includes sample data:
- 4 menu categories
- 10 ingredients with stock levels
- 8 menu items with recipes
- 3 discount codes
- Sample menu item ingredients

---

## 🚀 **Next Steps**

### **Immediate Actions**
1. Run the SQL schema in Supabase
2. Test user registration and login
3. Verify role-based access works
4. Test the dashboard functionality

### **Future Enhancements**
1. Add email verification
2. Implement password reset
3. Add user profile management
4. Create admin user management interface
5. Add real-time notifications
6. Implement offline mode (as per your server plan)

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Issue: "Invalid login credentials"**
- Solution: Check if user exists in `user_profiles` table
- Verify email is correct for the username

**Issue: "User profile not found"**
- Solution: Ensure user profile was created during registration
- Check if `user_profiles` table has the user record

**Issue: "Permission denied"**
- Solution: Check RLS policies
- Verify user role in `user_profiles` table

**Issue: "Database connection failed"**
- Solution: Check Supabase URL and API key
- Verify network connection

---

## 📞 **Support**

If you encounter any issues:
1. Check browser console for error messages
2. Verify Supabase dashboard for database status
3. Test with sample data provided in schema
4. Ensure all dependencies are installed

---

**🎉 Your Supabase authentication is now fully integrated and ready to use!**
