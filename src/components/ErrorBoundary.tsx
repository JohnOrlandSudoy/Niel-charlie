// Enhanced Error Boundary for Admin Panel
// Catches JavaScript errors anywhere in the component tree and displays fallback UI

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send error to monitoring service (if available)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real app, you would send this to your error monitoring service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId'),
        sessionId: localStorage.getItem('sessionId'),
      };

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.group('🐛 Error Report');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Full Report:', errorReport);
        console.groupEnd();
      }

      // Here you would send to your monitoring service
      // Example: Sentry.captureException(error, { extra: errorInfo });
      
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private reloadPage = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.href = '/admin/dashboard';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-red-900">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-red-700">
                    An unexpected error occurred
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="px-6 py-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Error Details
                </h3>
                <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                  {this.state.error.message}
                </p>
              </div>

              {/* Error ID for support */}
              <div className="text-xs text-gray-500 mb-4">
                Error ID: {this.state.errorId}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.resetError}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={this.goHome}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </button>
                
                <button
                  onClick={this.reloadPage}
                  className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reload</span>
                </button>
              </div>

              {/* Development Info */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-700 flex items-center space-x-2">
                    <Bug className="h-4 w-4" />
                    <span>Development Details</span>
                  </summary>
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                If this problem persists, please contact support with the Error ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;