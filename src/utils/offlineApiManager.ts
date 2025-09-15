// Offline API Manager - Routes requests to online/offline endpoints
import { directApiRequest } from './api';

export interface OfflineStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSync: number;
  failedSync: number;
}

export interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

class OfflineApiManager {
  private isOnline: boolean = navigator.onLine;
  private syncQueue: SyncQueueItem[] = [];
  private offlineStatus: OfflineStatus = {
    isOnline: true,
    lastSync: null,
    pendingSync: 0,
    failedSync: 0
  };

  constructor() {
    this.setupEventListeners();
    this.loadSyncQueue();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.offlineStatus.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.offlineStatus.isOnline = false;
    });
  }

  private async loadSyncQueue() {
    try {
      const response = await directApiRequest('/api/sync/queue');
      const result = await response.json();
      if (result.success && result.data) {
        this.syncQueue = result.data;
        this.offlineStatus.pendingSync = this.syncQueue.length;
      }
    } catch (error) {
      console.warn('Failed to load sync queue:', error);
    }
  }

  // Main API request router
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (this.isOnline) {
      return this.onlineRequest(endpoint, options);
    } else {
      return this.offlineRequest(endpoint, options);
    }
  }

  private async onlineRequest(endpoint: string, options: RequestInit): Promise<Response> {
    try {
      return await directApiRequest(endpoint, options);
    } catch (error) {
      // If online request fails, fallback to offline
      console.warn('Online request failed, falling back to offline:', error);
      this.isOnline = false;
      return this.offlineRequest(endpoint, options);
    }
  }

  private async offlineRequest(endpoint: string, options: RequestInit): Promise<Response> {
    // Route to appropriate offline endpoint
    const offlineEndpoint = this.mapToOfflineEndpoint(endpoint, options.method || 'GET');
    
    if (offlineEndpoint) {
      try {
        return await directApiRequest(offlineEndpoint, options);
      } catch (error) {
        // If offline endpoint fails, queue for later sync
        this.queueForSync(endpoint, options);
        throw error;
      }
    } else {
      // Queue for sync if no offline equivalent
      this.queueForSync(endpoint, options);
      throw new Error('Operation queued for sync when online');
    }
  }

  private mapToOfflineEndpoint(endpoint: string, method: string): string | null {
    // Map online endpoints to offline equivalents
    const mappings: Record<string, string> = {
      // Payment endpoints
      'POST /api/orders/*/payment': '/api/offline-payments/process',
      'PUT /api/orders/*/payment': '/api/offline-payments/process',
      
      // Auth endpoints (already support offline)
      'POST /api/auth/login': '/api/auth/login',
      
      // Sync endpoints
      'GET /api/sync/status': '/api/sync/status',
      'POST /api/sync/force-sync': '/api/sync/force-sync',
    };

    const key = `${method} ${endpoint}`;
    return mappings[key] || null;
  }

  private queueForSync(endpoint: string, options: RequestInit) {
    const queueItem: SyncQueueItem = {
      id: this.generateId(),
      endpoint,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body as string) : null,
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending'
    };

    this.syncQueue.push(queueItem);
    this.offlineStatus.pendingSync = this.syncQueue.length;
    this.saveSyncQueue();
  }

  private async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const itemsToSync = this.syncQueue.filter(item => item.status === 'pending');
    
    for (const item of itemsToSync) {
      try {
        item.status = 'syncing';
        await directApiRequest(item.endpoint, {
          method: item.method,
          body: item.data ? JSON.stringify(item.data) : undefined
        });
        
        item.status = 'synced';
        this.offlineStatus.lastSync = new Date();
      } catch (error) {
        item.status = 'failed';
        item.retryCount++;
        this.offlineStatus.failedSync++;
      }
    }

    // Remove synced items
    this.syncQueue = this.syncQueue.filter(item => item.status !== 'synced');
    this.offlineStatus.pendingSync = this.syncQueue.length;
    this.saveSyncQueue();
  }

  private saveSyncQueue() {
    localStorage.setItem('offline_sync_queue', JSON.stringify(this.syncQueue));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public methods
  getOfflineStatus(): OfflineStatus {
    return { ...this.offlineStatus };
  }

  async forceSync(): Promise<boolean> {
    try {
      const response = await directApiRequest('/api/sync/force-sync', { method: 'POST' });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Force sync failed:', error);
      return false;
    }
  }

  async getSyncStatus(): Promise<any> {
    try {
      const response = await directApiRequest('/api/sync/status');
      return await response.json();
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const offlineApiManager = new OfflineApiManager();
