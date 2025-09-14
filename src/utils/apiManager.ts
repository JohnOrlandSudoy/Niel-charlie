// Advanced API Manager for RestaurantOS Admin
// Handles request/response management, caching, error recovery, and state persistence

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheTimeout: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface RequestState {
  isLoading: boolean;
  error: string | null;
  lastFetch: number;
  retryCount: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiManager {
  private config: ApiConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private requestStates: Map<string, RequestState> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private offlineQueue: Array<{ endpoint: string; options: RequestInit; resolve: Function; reject: Function }> = [];

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: 'http://localhost:3000/api',
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      ...config
    };

    // Initialize offline detection
    this.setupOfflineDetection();
    
    // Process offline queue when back online
    window.addEventListener('online', () => this.processOfflineQueue());
    
    // Persist cache to localStorage
    this.loadCacheFromStorage();
    setInterval(() => this.saveCacheToStorage(), 30000); // Save every 30 seconds
  }

  // Core API request method with advanced error handling
  async request<T = any>(
    endpoint: string, 
    options: RequestInit = {},
    useCache: boolean = true,
    cacheKey?: string
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.config.baseURL}${endpoint}`;
    const key = cacheKey || `${options.method || 'GET'}:${endpoint}`;
    
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Check cache first
    if (useCache && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
      const cached = this.getFromCache(key);
      if (cached) {
        console.log(`📦 Cache hit for ${endpoint}`);
        return cached;
      }
    }

    // Set loading state
    this.setRequestState(key, { isLoading: true, error: null, lastFetch: Date.now(), retryCount: 0 });

    // Create request promise
    const requestPromise = this.executeRequest<T>(fullUrl, options, key, useCache);
    
    // Store pending request
    this.pendingRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(key);
    }
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    key: string,
    useCache: boolean
  ): Promise<ApiResponse<T>> {
    const authToken = this.getAuthToken();
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    };

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`🔄 API Request: ${options.method || 'GET'} ${url} (attempt ${attempt + 1})`);
        
        const response = await fetch(url, requestOptions);
        
        // Handle different response statuses
        if (response.status === 401) {
          this.handleUnauthorized();
          throw new Error('Unauthorized - please login again');
        }
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          await this.delay(retryAfter * 1000);
          continue;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result: ApiResponse<T> = await response.json();
        
        // Cache successful responses
        if (useCache && result.success) {
          this.setCache(key, result);
        }
        
        // Update request state
        this.setRequestState(key, { 
          isLoading: false, 
          error: null, 
          lastFetch: Date.now(), 
          retryCount: 0 
        });
        
        console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ API Error (attempt ${attempt + 1}):`, error);
        
        // Check if it's a network error and we're offline
        if (this.isOfflineError(error)) {
          return this.handleOfflineRequest(url, options, key);
        }
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }
    
    // All retries failed
    this.setRequestState(key, { 
      isLoading: false, 
      error: lastError?.message || 'Request failed', 
      lastFetch: Date.now(), 
      retryCount: this.config.retryAttempts 
    });
    
    throw lastError || new Error('Request failed after all retries');
  }

  private handleOfflineRequest(url: string, options: RequestInit, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('📱 Offline - queuing request for later');
      
      // Try to get cached data if available
      const cached = this.getFromCache(key);
      if (cached) {
        resolve(cached);
        return;
      }
      
      // Queue request for when back online
      this.offlineQueue.push({ endpoint: url, options, resolve, reject });
      
      // Set error state
      this.setRequestState(key, { 
        isLoading: false, 
        error: 'Offline - request queued', 
        lastFetch: Date.now(), 
        retryCount: 0 
      });
      
      reject(new Error('Offline - request queued'));
    });
  }

  private async processOfflineQueue() {
    console.log(`🔄 Processing ${this.offlineQueue.length} queued requests`);
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const { endpoint, options, resolve, reject } of queue) {
      try {
        const result = await this.request(endpoint, options, true);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  }

  // Cache management
  private getFromCache(key: string): ApiResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(key: string, data: ApiResponse) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheTimeout
    });
  }

  private loadCacheFromStorage() {
    try {
      const stored = localStorage.getItem('api_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(Object.entries(cacheData));
        console.log('📦 Loaded cache from storage');
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  private saveCacheToStorage() {
    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem('api_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  // State management
  private setRequestState(key: string, state: RequestState) {
    this.requestStates.set(key, state);
    this.notifyStateChange(key, state);
  }

  private notifyStateChange(key: string, state: RequestState) {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('api-state-change', {
      detail: { key, state }
    }));
  }

  // Utility methods
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private handleUnauthorized() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Don't redirect immediately - let components handle it
    window.dispatchEvent(new CustomEvent('auth-expired'));
  }

  private setupOfflineDetection() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online');
      this.processOfflineQueue();
    });
    
    window.addEventListener('offline', () => {
      console.log('📱 Gone offline');
    });
  }

  private isOfflineError(error: any): boolean {
    return error.name === 'TypeError' || 
           error.message.includes('fetch') || 
           error.message.includes('network') ||
           !navigator.onLine;
  }

  private isNonRetryableError(error: any): boolean {
    return error.message.includes('401') || 
           error.message.includes('403') || 
           error.message.includes('404');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for components
  getRequestState(key: string): RequestState | null {
    return this.requestStates.get(key) || null;
  }

  clearCache(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    console.log('🗑️ Cache cleared');
  }

  invalidateCache(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key, entry] of this.cache.entries()) {
        if (regex.test(key)) {
          entry.expiresAt = 0; // Mark as expired
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Optimistic updates
  async optimisticUpdate<T>(
    endpoint: string,
    options: RequestInit,
    optimisticData: T,
    rollbackData?: T
  ): Promise<ApiResponse<T>> {
    const key = `${options.method || 'GET'}:${endpoint}`;
    
    // Apply optimistic update immediately
    if (rollbackData) {
      this.setCache(key, { success: true, data: optimisticData });
    }
    
    try {
      const result = await this.request<T>(endpoint, options, false);
      return result;
    } catch (error) {
      // Rollback on error
      if (rollbackData) {
        this.setCache(key, { success: true, data: rollbackData });
      }
      throw error;
    }
  }
}

// Create singleton instance
export const apiManager = new ApiManager();

// Enhanced API wrapper with manager integration
export const enhancedApi = {
  // Orders
  orders: {
    getAll: (params?: any) => apiManager.request('/orders', { method: 'GET' }, true, `orders:${JSON.stringify(params)}`),
    getById: (id: string) => apiManager.request(`/orders/${id}`),
    create: (data: any) => apiManager.request('/orders', { method: 'POST', body: JSON.stringify(data) }, false),
    update: (id: string, data: any) => apiManager.request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }, false),
    delete: (id: string) => apiManager.request(`/orders/${id}`, { method: 'DELETE' }, false),
    getKitchenOrders: () => apiManager.request('/orders/kitchen/orders'),
  },

  // Menu
  menus: {
    getAll: (params?: any) => apiManager.request('/menus', { method: 'GET' }, true, `menus:${JSON.stringify(params)}`),
    getById: (id: string) => apiManager.request(`/menus/${id}`),
    create: (data: any) => apiManager.request('/menus', { method: 'POST', body: JSON.stringify(data) }, false),
    update: (id: string, data: any) => apiManager.request(`/menus/${id}`, { method: 'PUT', body: JSON.stringify(data) }, false),
    delete: (id: string) => apiManager.request(`/menus/${id}`, { method: 'DELETE' }, false),
  },

  // Inventory
  inventory: {
    getAllIngredients: () => apiManager.request('/inventory/ingredients'),
    getById: (id: string) => apiManager.request(`/inventory/ingredients/${id}`),
    update: (id: string, data: any) => apiManager.request(`/inventory/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }, false),
    create: (data: any) => apiManager.request('/inventory/ingredients', { method: 'POST', body: JSON.stringify(data) }, false),
  },

  // Payments
  payments: {
    getAvailableMethods: () => apiManager.request('/payments/methods/available'),
    getStatus: (orderId: string) => apiManager.request(`/orders/${orderId}/payment-status`),
    cancel: (paymentIntentId: string) => apiManager.request(`/payments/cancel/${paymentIntentId}`, { method: 'POST' }, false),
  },

  // Dashboard
  dashboard: {
    getStats: () => apiManager.request('/dashboard/stats'),
    getRecentOrders: () => apiManager.request('/dashboard/recent-orders'),
    getSalesData: () => apiManager.request('/dashboard/sales-data'),
  },
};

export default apiManager;
