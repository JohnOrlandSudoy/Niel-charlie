import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Sync, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useOfflinePayment } from '../../hooks/useOfflinePayment';

const OfflineStatusIndicator: React.FC = () => {
  const { isOnline, syncStatus, getSyncStatus, forceSync, getOfflineStatus } = useOfflinePayment();
  const [offlineStatus, setOfflineStatus] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await getSyncStatus();
        const offlineStatus = getOfflineStatus();
        setOfflineStatus(offlineStatus);
      } catch (error) {
        console.error('Failed to load status:', error);
      }
    };

    loadStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [getSyncStatus, getOfflineStatus]);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceSync();
      // Refresh status after sync
      const status = await getSyncStatus();
      const offlineStatus = getOfflineStatus();
      setOfflineStatus(offlineStatus);
    } catch (error) {
      console.error('Force sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (offlineStatus?.pendingSync > 0) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (offlineStatus?.pendingSync > 0) return <Clock className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (offlineStatus?.pendingSync > 0) return `${offlineStatus.pendingSync} Pending`;
    return 'Online';
  };

  return (
    <div className="relative">
      {/* Status Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors duration-200 ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>

      {/* Details Panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Connection Status</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Status Overview */}
            <div className="space-y-3">
              {/* Online/Offline Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection:</span>
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-600">Offline</span>
                    </>
                  )}
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Sync:</span>
                <span className="text-sm text-gray-900">
                  {offlineStatus?.lastSync 
                    ? new Date(offlineStatus.lastSync).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>

              {/* Pending Sync */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Sync:</span>
                <span className="text-sm text-gray-900">
                  {offlineStatus?.pendingSync || 0}
                </span>
              </div>

              {/* Failed Sync */}
              {offlineStatus?.failedSync > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failed Sync:</span>
                  <span className="text-sm text-red-600">
                    {offlineStatus.failedSync}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleForceSync}
                disabled={isSyncing || !isOnline}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Sync className="h-4 w-4" />
                    <span>Sync Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-3 text-xs text-gray-500">
              {!isOnline ? (
                <p>You're currently offline. Operations will be queued for sync when connection is restored.</p>
              ) : offlineStatus?.pendingSync > 0 ? (
                <p>Some operations are pending sync. Click "Sync Now" to process them.</p>
              ) : (
                <p>All operations are synced. You're fully up to date.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineStatusIndicator;
