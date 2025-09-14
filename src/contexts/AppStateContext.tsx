// Global App State Context for Admin Panel
// Manages navigation state, prevents accidental navigation away from current page

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface NavigationState {
  currentPage: string;
  previousPage: string | null;
  navigationHistory: string[];
  isNavigating: boolean;
  pendingNavigation: string | null;
}

interface AppState {
  navigation: NavigationState;
  isOnline: boolean;
  lastActivity: number;
  isIdle: boolean;
  systemNotifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: number;
    autoDismiss?: boolean;
    dismissAfter?: number;
  }>;
}

interface AppStateContextType {
  // Navigation
  currentPage: string;
  navigateTo: (page: string, force?: boolean) => void;
  goBack: () => void;
  canGoBack: boolean;
  isNavigating: boolean;
  
  // System state
  isOnline: boolean;
  isIdle: boolean;
  lastActivity: number;
  
  // Notifications
  notifications: AppState['systemNotifications'];
  addNotification: (notification: Omit<AppState['systemNotifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Persistence
  saveState: () => void;
  restoreState: () => void;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

interface AppStateProviderProps {
  children: React.ReactNode;
  initialPage?: string;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ 
  children, 
  initialPage = 'dashboard' 
}) => {
  const [appState, setAppState] = useState<AppState>({
    navigation: {
      currentPage: initialPage,
      previousPage: null,
      navigationHistory: [initialPage],
      isNavigating: false,
      pendingNavigation: null,
    },
    isOnline: navigator.onLine,
    lastActivity: Date.now(),
    isIdle: false,
    systemNotifications: [],
  });

  // Auto-save state to localStorage
  const saveState = useCallback(() => {
    try {
      const stateToSave = {
        currentPage: appState.navigation.currentPage,
        navigationHistory: appState.navigation.navigationHistory.slice(-10), // Keep last 10 pages
        lastActivity: appState.lastActivity,
      };
      localStorage.setItem('app_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }, [appState]);

  // Restore state from localStorage
  const restoreState = useCallback(() => {
    try {
      const saved = localStorage.getItem('app_state');
      if (saved) {
        const savedState = JSON.parse(saved);
        setAppState(prev => ({
          ...prev,
          navigation: {
            ...prev.navigation,
            currentPage: savedState.currentPage || initialPage,
            navigationHistory: savedState.navigationHistory || [initialPage],
          },
          lastActivity: savedState.lastActivity || Date.now(),
        }));
      }
    } catch (error) {
      console.error('Failed to restore app state:', error);
    }
  }, [initialPage]);

  // Navigation functions
  const navigateTo = useCallback((page: string, force: boolean = false) => {
    if (page === appState.navigation.currentPage && !force) {
      return; // Already on this page
    }

    // Prevent navigation if currently navigating
    if (appState.navigation.isNavigating && !force) {
      setAppState(prev => ({
        ...prev,
        navigation: {
          ...prev.navigation,
          pendingNavigation: page,
        },
      }));
      return;
    }

    setAppState(prev => ({
      ...prev,
      navigation: {
        currentPage: page,
        previousPage: prev.navigation.currentPage,
        navigationHistory: [...prev.navigation.navigationHistory.slice(-9), page], // Keep last 10
        isNavigating: true,
        pendingNavigation: null,
      },
      lastActivity: Date.now(),
    }));

    // Complete navigation after a short delay
    setTimeout(() => {
      setAppState(prev => ({
        ...prev,
        navigation: {
          ...prev.navigation,
          isNavigating: false,
        },
      }));
    }, 100);
  }, [appState.navigation.currentPage, appState.navigation.isNavigating]);

  const goBack = useCallback(() => {
    if (appState.navigation.navigationHistory.length > 1) {
      const newHistory = [...appState.navigation.navigationHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];
      
      setAppState(prev => ({
        ...prev,
        navigation: {
          currentPage: previousPage,
          previousPage: prev.navigation.currentPage,
          navigationHistory: newHistory,
          isNavigating: true,
          pendingNavigation: null,
        },
        lastActivity: Date.now(),
      }));

      // Complete navigation
      setTimeout(() => {
        setAppState(prev => ({
          ...prev,
          navigation: {
            ...prev.navigation,
            isNavigating: false,
          },
        }));
      }, 100);
    }
  }, [appState.navigation.navigationHistory]);

  // Notification functions
  const addNotification = useCallback((notification: Omit<AppState['systemNotifications'][0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      autoDismiss: notification.autoDismiss ?? true,
      dismissAfter: notification.dismissAfter ?? 5000,
    };

    setAppState(prev => ({
      ...prev,
      systemNotifications: [...prev.systemNotifications, newNotification],
    }));

    // Auto-dismiss notification
    if (newNotification.autoDismiss) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.dismissAfter);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setAppState(prev => ({
      ...prev,
      systemNotifications: prev.systemNotifications.filter(n => n.id !== id),
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      systemNotifications: [],
    }));
  }, []);

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => {
      setAppState(prev => ({
        ...prev,
        lastActivity: Date.now(),
        isIdle: false,
      }));
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Idle detection
  useEffect(() => {
    const idleTimeout = setTimeout(() => {
      setAppState(prev => ({
        ...prev,
        isIdle: true,
      }));
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(idleTimeout);
  }, [appState.lastActivity]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setAppState(prev => ({
        ...prev,
        isOnline: true,
      }));
      addNotification({
        type: 'success',
        message: 'Connection restored',
        autoDismiss: true,
        dismissAfter: 3000,
      });
    };

    const handleOffline = () => {
      setAppState(prev => ({
        ...prev,
        isOnline: false,
      }));
      addNotification({
        type: 'warning',
        message: 'Connection lost - working offline',
        autoDismiss: false,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);

  // Save state periodically
  useEffect(() => {
    const interval = setInterval(saveState, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [saveState]);

  // Save state on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  // Restore state on mount
  useEffect(() => {
    restoreState();
  }, [restoreState]);

  // Process pending navigation
  useEffect(() => {
    if (appState.navigation.pendingNavigation && !appState.navigation.isNavigating) {
      navigateTo(appState.navigation.pendingNavigation, true);
    }
  }, [appState.navigation.pendingNavigation, appState.navigation.isNavigating, navigateTo]);

  const contextValue: AppStateContextType = {
    // Navigation
    currentPage: appState.navigation.currentPage,
    navigateTo,
    goBack,
    canGoBack: appState.navigation.navigationHistory.length > 1,
    isNavigating: appState.navigation.isNavigating,
    
    // System state
    isOnline: appState.isOnline,
    isIdle: appState.isIdle,
    lastActivity: appState.lastActivity,
    
    // Notifications
    notifications: appState.systemNotifications,
    addNotification,
    removeNotification,
    clearNotifications,
    
    // Persistence
    saveState,
    restoreState,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

// Higher-order component for page-level state persistence
export const withPagePersistence = <P extends object>(
  Component: React.ComponentType<P>,
  pageId: string
) => {
  return (props: P) => {
    const { navigateTo, currentPage } = useAppState();
    
    useEffect(() => {
      // If we're not on the expected page, navigate to it
      if (currentPage !== pageId) {
        navigateTo(pageId);
      }
    }, [currentPage, pageId, navigateTo]);

    return <Component {...props} />;
  };
};
