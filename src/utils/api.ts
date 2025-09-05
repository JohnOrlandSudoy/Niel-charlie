// API utility functions for making authenticated requests

const API_BASE_URL = 'http://localhost:3000/api';

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Get user data from localStorage
export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

// Make authenticated API request
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // If unauthorized, clear auth data and redirect to login
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/signin';
  }

  return response;
};

// API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: { username: string; password: string }) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    register: (userData: any) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    logout: () =>
      apiRequest('/auth/logout', {
        method: 'POST',
      }),
  },

  // User endpoints
  users: {
    getProfile: () => apiRequest('/users/profile'),
    updateProfile: (data: any) =>
      apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Menu endpoints
  menus: {
    getAll: () => apiRequest('/menus'),
    getById: (id: string) => apiRequest(`/menus/${id}`),
    create: (data: any) =>
      apiRequest('/menus', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/menus/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
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

  // Order endpoints
  orders: {
    getOrders: () => apiRequest('/orders'),
    createOrder: (data: any) =>
      apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateOrder: (id: string, data: any) =>
      apiRequest(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getOrder: (id: string) => apiRequest(`/orders/${id}`),
  },

  // Inventory endpoints
  inventory: {
    getIngredients: () => apiRequest('/inventory/ingredients'),
    createIngredient: (data: any) =>
      apiRequest('/inventory/ingredients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateIngredient: (id: string, data: any) =>
      apiRequest(`/inventory/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getStockMovements: () => apiRequest('/inventory/stock-movements'),
    createStockMovement: (data: any) =>
      apiRequest('/inventory/stock-movements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
