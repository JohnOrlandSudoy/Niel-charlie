import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SignIn from './components/Auth/SignIn';
import SignUp from './components/Auth/SignUp';
import AdminLayout from './components/Layout/AdminLayout';
import CashierLayout from './components/Layout/CashierLayout';
import KitchenLayout from './components/Layout/KitchenLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';

// Main App component with routing
const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to sign in
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  // If authenticated, show role-specific dashboard
  return (
    <Routes>
      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        } 
      />

      {/* Cashier Routes */}
      <Route 
        path="/cashier/*" 
        element={
          <ProtectedRoute allowedRoles={['cashier']}>
            <CashierLayout />
          </ProtectedRoute>
        } 
      />

      {/* Kitchen Routes */}
      <Route 
        path="/kitchen/*" 
        element={
          <ProtectedRoute allowedRoles={['kitchen']}>
            <KitchenLayout />
          </ProtectedRoute>
        } 
      />

      {/* Default redirect based on user role */}
      <Route 
        path="/" 
        element={
          <Navigate 
            to={
              user?.role === 'admin' ? '/admin' : 
              user?.role === 'cashier' ? '/cashier' : '/kitchen'
            } 
            replace 
          />
        } 
      />

      {/* Catch all other routes */}
      <Route 
        path="*" 
        element={
          <Navigate 
            to={
              user?.role === 'admin' ? '/admin' : 
              user?.role === 'cashier' ? '/cashier' : '/kitchen'
            } 
            replace 
          />
        } 
      />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;