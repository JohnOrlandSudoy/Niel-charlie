// API utility functions for making authenticated requests
import { offlineApiManager } from './offlineApiManager';
import { config } from './config';

// Force the correct API URL to override any cached configuration
const API_BASE_URL = 'https://server-resturant-3.onrender.com/api';
console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Config object:', config);
console.log('Config API baseUrl:', config.api.baseUrl);
console.log('Using hardcoded API_BASE_URL to override config');

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  console.log('getAuthToken called:');
  console.log('- Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
  console.log('- All localStorage keys:', Object.keys(localStorage));
  return token;
};

// Get user data from localStorage
export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

// Make authenticated API request (with offline support)
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Use offline API manager for automatic online/offline routing
  return await offlineApiManager.request(endpoint, options);
};

// Legacy direct API request (for internal use)
export const directApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  console.log('API Request Debug:');
  console.log('- Endpoint:', endpoint);
  console.log('- Token exists:', !!token);
  console.log('- Token value:', token ? `${token.substring(0, 20)}...` : 'null');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
    console.log('- Authorization header set');
  } else {
    console.log('- No token found, request will be unauthorized');
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('Making API request to:', fullUrl);
  console.log('Request timestamp:', new Date().toISOString());
  console.log('Request headers:', config.headers);
  console.log('Authorization header:', (config.headers as any)?.Authorization);
  console.log('Authorization header type:', typeof (config.headers as any)?.Authorization);
  console.log('Authorization header length:', (config.headers as any)?.Authorization?.length);
  const response = await fetch(fullUrl, config);
  
  // Log response details for debugging
  console.log('Response status:', response.status);
  console.log('Response statusText:', response.statusText);
  
  // If unauthorized, clear auth data and redirect to login
  // But skip redirect for endpoints that might not be implemented yet or for login attempts
  if (response.status === 401) {
    const skipRedirectEndpoints = [
      '/auth/users',
      '/auth/create-admin',
      '/auth/create-cashier',
      '/auth/create-kitchen',
      '/auth/users/',
      '/auth/login'  // Don't redirect on login failures - let the component handle the error
    ];
    
    const shouldSkipRedirect = skipRedirectEndpoints.some(skipEndpoint => 
      endpoint.includes(skipEndpoint)
    );
    
    if (!shouldSkipRedirect) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Store error message for display after redirect
      const errorMessage = 'Session expired. Please sign in again.';
      localStorage.setItem('lastLoginError', JSON.stringify({
        message: errorMessage,
        timestamp: new Date().toISOString(),
        type: 'session_expired'
      }));
      
      window.location.href = '/signin';
    }
  }
  
  // Also handle other error statuses for user management endpoints
  // to prevent unexpected redirects when server is not available
  if (response.status >= 400 && response.status < 600) {
    const skipRedirectEndpoints = [
      '/auth/users',
      '/auth/create-admin',
      '/auth/create-cashier',
      '/auth/create-kitchen',
      '/auth/users/'
    ];
    
    const shouldSkipRedirect = skipRedirectEndpoints.some(skipEndpoint => 
      endpoint.includes(skipEndpoint)
    );
    
    if (shouldSkipRedirect) {
      console.log(`API endpoint ${endpoint} returned ${response.status}, but skipping redirect for user management`);
    }
  }

  return response;
};

// API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { username: string; password: string }) =>
      directApiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    // Admin user management endpoints - role-specific creation
    createAdmin: (userData: any) =>
      directApiRequest('/auth/create-admin', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    createCashier: (userData: any) =>
      directApiRequest('/auth/create-cashier', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    createKitchen: (userData: any) =>
      directApiRequest('/auth/create-kitchen', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    getAllUsers: () =>
      directApiRequest('/auth/users'),
    
    updateUser: (userId: string, userData: any) =>
      directApiRequest(`/auth/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),
    
    deleteUser: (userId: string) =>
      directApiRequest(`/auth/users/${userId}`, {
        method: 'DELETE',
      }),
    
    logout: () =>
      directApiRequest('/auth/logout', {
        method: 'POST',
      }),


    changePassword: (currentPassword: string, newPassword: string) =>
      directApiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),

    resendVerification: (email: string) =>
      directApiRequest('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  // User endpoints
  users: {
    getProfile: () => directApiRequest('/users/profile'),
    updateProfile: (data: any) =>
      directApiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Menu endpoints
  menus: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      category?: string;
      available?: boolean;
      featured?: boolean;
      search?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.available !== undefined) queryParams.append('available', params.available.toString());
      if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/menus/?${queryString}` : '/menus/';
      return apiRequest(endpoint);
    },
    getById: (id: string) => apiRequest(`/menus/${id}`),
    create: (data: any, imageFile?: File) => {
      if (imageFile) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', imageFile);
        
        // Append other fields
        Object.keys(data).forEach(key => {
          if (key !== 'image' && data[key] !== undefined && data[key] !== null) {
            if (Array.isArray(data[key])) {
              formData.append(key, JSON.stringify(data[key]));
            } else {
              formData.append(key, data[key].toString());
            }
          }
        });

        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        return fetch(`${API_BASE_URL}/menus`, {
          method: 'POST',
          headers,
          body: formData,
        });
      } else {
        // Regular JSON request
        return apiRequest('/menus', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    },
    update: (id: string, data: any, imageFile?: File) => {
      if (imageFile) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', imageFile);
        
        // Append other fields
        Object.keys(data).forEach(key => {
          if (key !== 'image' && data[key] !== undefined && data[key] !== null) {
            if (Array.isArray(data[key])) {
              formData.append(key, JSON.stringify(data[key]));
            } else {
              formData.append(key, data[key].toString());
            }
          }
        });

        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        return fetch(`${API_BASE_URL}/menus/${id}`, {
          method: 'PUT',
          headers,
          body: formData,
        });
      } else {
        // Regular JSON request
        return apiRequest(`/menus/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
    },
    delete: (id: string) =>
      apiRequest(`/menus/${id}`, {
        method: 'DELETE',
      }),
  },

  // Menu Categories endpoints
  categories: {
    getAll: () => apiRequest('/menus/categories'),
    getById: (id: string) => apiRequest(`/menus/categories/${id}`),
    create: (data: any) =>
      apiRequest('/menus/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/menus/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/menus/categories/${id}`, {
        method: 'DELETE',
      }),
  },


  // Inventory endpoints
  inventory: {
    // GET All Ingredients (Public)
    getAllIngredients: () => apiRequest('/inventory/'),
    
    // GET Ingredient by ID (Public)
    getIngredientById: (id: string) => apiRequest(`/inventory/ingredients/${id}`),
    
    // CREATE Ingredient (Admin Only)
    createIngredient: (data: any) =>
      apiRequest('/inventory/ingredients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // UPDATE Ingredient (Admin Only)
    updateIngredient: (id: string, data: any) =>
      apiRequest(`/inventory/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // DELETE Ingredient (Admin Only)
    deleteIngredient: (id: string) =>
      apiRequest(`/inventory/ingredients/${id}`, {
        method: 'DELETE',
      }),
    
    // GET Stock Movements (Admin Only)
    getStockMovements: (params?: {
      page?: number;
      limit?: number;
      ingredient_id?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.ingredient_id) queryParams.append('ingredient_id', params.ingredient_id);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/inventory/movements?${queryString}` : '/inventory/movements';
      return apiRequest(endpoint);
    },
    
    // CREATE Stock Movement (Admin Only)
    createStockMovement: (data: any) =>
      apiRequest('/inventory/movements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Menu Item Ingredient Linking (Admin Only)
    // Link ingredient to menu item
    linkIngredientToMenuItem: (menuItemId: string, data: any) =>
      apiRequest(`/inventory/menu-items/${menuItemId}/ingredients`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // Get ingredients for a menu item
    getMenuItemIngredients: (menuItemId: string) =>
      apiRequest(`/inventory/menu-items/${menuItemId}/ingredients`),
    
    // Update ingredient requirements
    updateMenuItemIngredient: (linkId: string, data: any) =>
      apiRequest(`/inventory/menu-items/ingredients/${linkId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // Remove ingredient from menu item
    removeMenuItemIngredient: (linkId: string) =>
      apiRequest(`/inventory/menu-items/ingredients/${linkId}`, {
        method: 'DELETE',
      }),
  },

  // Orders endpoints
  orders: {
    // GET All Orders
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      order_type?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.order_type) queryParams.append('order_type', params.order_type);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/orders/?${queryString}` : '/orders/';
      return apiRequest(endpoint);
    },

    // Search Orders
    search: (params: {
      q: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('q', params.q);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      return apiRequest(`/orders/search?${queryParams.toString()}`);
    },

    // GET Order by ID
    getById: (id: string) => apiRequest(`/orders/${id}`),

    // GET Order by Order Number
    getByOrderNumber: (orderNumber: string) => apiRequest(`/orders/number/${orderNumber}`),

    // CREATE New Order
    create: (data: any) =>
      apiRequest('/orders/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // ADD Item to Order
    addItem: (orderId: string, data: any) =>
      apiRequest(`/orders/${orderId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // UPDATE Order Item
    updateItem: (itemId: string, data: any) =>
      apiRequest(`/orders/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    // DELETE Order Item
    deleteItem: (itemId: string) =>
      apiRequest(`/orders/items/${itemId}`, {
        method: 'DELETE',
      }),

    // GET Order Items
    getItems: (orderId: string) => apiRequest(`/orders/${orderId}/items`),

    // GET Menu Item Availability
    getMenuItemAvailability: (menuItemId: string, quantity: number = 1) =>
      apiRequest(`/orders/menu-items/${menuItemId}/availability?quantity=${quantity}`),

    // GET Order Ingredient Validation
    getOrderIngredientValidation: (orderId: string) =>
      apiRequest(`/orders/${orderId}/ingredient-validation`),

    // UPDATE Payment Status
    updatePayment: (orderId: string, data: any) =>
      apiRequest(`/orders/${orderId}/payment`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    // PayMongo Payment Integration
    createPayMongoPayment: (orderId: string, data: any) =>
      apiRequest(`/orders/${orderId}/paymongo-payment`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // GET Available Discounts
    getAvailableDiscounts: () => apiRequest('/orders/discounts/available'),

    // APPLY Discount to Order
    applyDiscount: (orderId: string, data: { discount_code: string }) =>
      apiRequest(`/orders/${orderId}/discounts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Kitchen Order Management
    // GET Kitchen Orders
    getKitchenOrders: () => apiRequest('/orders/kitchen/orders'),

    // UPDATE Order Status
    updateOrderStatus: (orderId: string, data: { status: string; notes?: string }) =>
      apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    // GET Order Status History
    getOrderStatusHistory: (orderId: string) => apiRequest(`/orders/${orderId}/history`),

    // DELETE Single Order (Admin Only)
    delete: (orderId: string, force: boolean = false) => {
      const url = force ? `/orders/${orderId}?force=true` : `/orders/${orderId}`;
      return apiRequest(url, {
        method: 'DELETE',
      });
    },

    // DELETE Bulk Orders (Admin Only)
    bulkDelete: (orderIds: string[], force: boolean = false) =>
      apiRequest('/orders/bulk/delete', {
        method: 'DELETE',
        body: JSON.stringify({ orderIds, force }),
      }),

    // CANCEL Order (Soft Delete)
    cancel: (orderId: string, reason: string) =>
      apiRequest(`/orders/${orderId}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),

    // GET Order Receipt
    getReceipt: (orderId: string) =>
      apiRequest(`/orders/${orderId}/receipt`),
  },

  // Payments endpoints
  payments: {
    // GET Payment Status (using payment intent ID)
    getStatus: (paymentIntentId: string) => 
      apiRequest(`/payments/status/${paymentIntentId}`),

    // GET All Orders with PayMongo Payments (for admin management)
    getOrdersWithPayMongoPayments: (params?: {
      page?: number;
      limit?: number;
      status?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('payment_method', 'paymongo');
      
      const query = queryParams.toString();
      return apiRequest(`/orders${query ? `?${query}` : ''}`);
    },

    // CANCEL Payment
    cancel: (paymentIntentId: string) =>
      apiRequest(`/payments/cancel/${paymentIntentId}`, {
        method: 'POST',
      }),

    // WEBHOOK Processing (Internal - for PayMongo webhooks)
    processWebhook: (webhookData: any) =>
      apiRequest('/payments/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookData),
      }),

    // GET Payment History for Order
    getPaymentHistory: (orderId: string) =>
      apiRequest(`/payments/order/${orderId}/history`),

    // MANUAL Payment Sync (Backup when webhooks fail)
    syncPayment: (orderId: string) =>
      apiRequest(`/orders/${orderId}/sync-payment`, {
        method: 'POST',
      }),

    // Admin Payment Methods Management
    getAdminMethods: () => 
      apiRequest('/payments/admin/methods'),

    toggleMethod: (methodKey: string, isEnabled: boolean) =>
      apiRequest(`/payments/admin/methods/${methodKey}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ is_enabled: isEnabled }),
      }),

    updateMethod: (methodKey: string, data: any) =>
      apiRequest(`/payments/admin/methods/${methodKey}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    createMethod: (data: any) =>
      apiRequest('/payments/admin/methods', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteMethod: (methodKey: string) =>
      apiRequest(`/payments/admin/methods/${methodKey}`, {
        method: 'DELETE',
      }),

    // Public Payment Methods (Cashier - only enabled methods)
    getAvailableMethods: () => 
      apiRequest('/payments/methods/available'),
  },

  // Discounts endpoints
  discounts: {
    // GET All Discounts (Admin Only) - Using the same endpoint as available since that's what's implemented
    getAll: (_params?: {
      page?: number;
      limit?: number;
      status?: 'active' | 'inactive' | 'expired';
      search?: string;
    }) => {
      // For now, we'll use the available endpoint since that's what's implemented
      // The filtering will be done on the frontend
      return apiRequest('/orders/discounts/available');
    },

    // GET Available Discounts (Cashier/Admin)
    getAvailable: () => apiRequest('/orders/discounts/available'),

    // GET Discount by ID
    getById: (id: string) => apiRequest(`/orders/discounts/${id}`),

    // CREATE Discount (Admin Only)
    create: (data: any) =>
      apiRequest('/orders/discounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // UPDATE Discount (Admin Only)
    update: (id: string, data: any) =>
      apiRequest(`/orders/discounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    // DELETE Discount (Admin Only)
    delete: (id: string) =>
      apiRequest(`/orders/discounts/${id}`, {
        method: 'DELETE',
      }),

    // TOGGLE Discount Status (Admin Only)
    toggleStatus: (id: string) =>
      apiRequest(`/orders/discounts/${id}/toggle`, {
        method: 'PUT',
      }),

    // GET Discount Statistics (Admin Only)
    getStats: () => apiRequest('/orders/discounts/stats'),

    // VALIDATE Discount Code
    validate: (code: string, orderAmount?: number) => {
      const queryParams = new URLSearchParams();
      queryParams.append('code', code);
      if (orderAmount) queryParams.append('order_amount', orderAmount.toString());
      
      return apiRequest(`/orders/discounts/validate?${queryParams.toString()}`);
    },

    // APPLY Discount to Order
    applyToOrder: (orderId: string, discountCode: string) =>
      apiRequest(`/orders/${orderId}/discounts`, {
        method: 'POST',
        body: JSON.stringify({ discount_code: discountCode }),
      }),
  },
};