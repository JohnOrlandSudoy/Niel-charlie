// Loading Overlay Component for Admin Panel

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  progress?: number;
  onCancel?: () => void;
  showProgress?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...', 
  progress,
  onCancel,
  showProgress = false
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          {/* Loading spinner */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-200"></div>
            </div>
          </div>

          {/* Message */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {message}
          </h3>

          {/* Progress bar */}
          {showProgress && progress !== undefined && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {/* Cancel button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
          )}

          {/* Loading tips */}
          <div className="mt-6 text-xs text-gray-500">
            <p>💡 Tip: Keep this tab open for the best experience</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Specialized loading components
export const PageLoadingOverlay: React.FC<{ pageName: string }> = ({ pageName }) => (
  <LoadingOverlay 
    message={`Loading ${pageName}...`}
    showProgress={false}
  />
);

export const DataLoadingOverlay: React.FC<{ 
  message?: string; 
  progress?: number;
  onCancel?: () => void;
}> = ({ message, progress, onCancel }) => (
  <LoadingOverlay 
    message={message || 'Fetching data...'}
    progress={progress}
    onCancel={onCancel}
    showProgress={progress !== undefined}
  />
);

export const SavingOverlay: React.FC<{ 
  message?: string; 
  progress?: number;
}> = ({ message, progress }) => (
  <LoadingOverlay 
    message={message || 'Saving changes...'}
    progress={progress}
    showProgress={progress !== undefined}
  />
);

export default LoadingOverlay;
