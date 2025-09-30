import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AdminCreateUserData, AdminUpdateUserData, AuthContextType, ChangePasswordData } from '../types/auth';
import { api } from '../utils/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          setUser(user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      // Don't set loading to true for login to avoid loading page
      console.log('AuthContext: Starting login for:', credentials.username);
      
      // Call your API server
      const response = await api.auth.login(credentials);
      console.log('AuthContext: Response status:', response.status);
      
      // Handle different response statuses
      if (response.status === 401) {
        // Unauthorized - wrong credentials
        const result = await response.json();
        console.log('AuthContext: Unauthorized response:', result);
        return { success: false, message: result.error || result.message || 'Invalid credentials' };
      }
      
      if (!response.ok) {
        // Other HTTP errors
        const result = await response.json();
        console.log('AuthContext: Error response:', result);
        return { success: false, message: result.error || result.message || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      const result = await response.json();
      console.log('AuthContext: API response:', result);

      if (result.success && result.data) {
        // Store token and user data
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('userData', JSON.stringify(result.data.user));
        
        setUser(result.data.user);
        console.log('AuthContext: User set successfully:', result.data.user);
        return { success: true, user: result.data.user, message: result.message };
      } else {
        console.log('AuthContext: Login failed:', result.error || result.message);
        return { success: false, message: result.error || result.message || 'Login failed' };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      
      // Store error message for potential redirect scenarios
      const errorMessage = 'Network error. Please check your internet connection and try again.';
      localStorage.setItem('lastLoginError', JSON.stringify({
        message: errorMessage,
        timestamp: new Date().toISOString(),
        type: 'network'
      }));
      
      // Fallback to mock authentication for development
      console.log('AuthContext: Falling back to mock authentication');
      return await mockAuthentication(credentials);
    } finally {
      // Don't set loading to false since we didn't set it to true
    }
  };

  // Mock authentication for development/offline mode
  const mockAuthentication = async (credentials: LoginCredentials) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock users for development - matching real server format
    const mockUsers = [
      { 
        id: 'bd861443-15fe-40ae-8582-7086204a5378', 
        username: 'newadmin', 
        email: 'newadmin@restaurant.com', 
        role: 'admin', 
        firstName: 'New', 
        lastName: 'Admin',
        phone: '+639345678901'
      },
      { 
        id: '2', 
        username: 'cashier', 
        email: 'cashier@restaurant.com', 
        role: 'cashier', 
        firstName: 'Cashier', 
        lastName: 'User',
        phone: '+639345678902'
      },
      { 
        id: '3', 
        username: 'kitchen', 
        email: 'kitchen@restaurant.com', 
        role: 'kitchen', 
        firstName: 'Kitchen', 
        lastName: 'User',
        phone: '+639345678903'
      }
    ];

    const mockPasswords = {
      'newadmin': 'password123',
      'cashier': 'cashier123',
      'kitchen': 'kitchen123'
    };

    console.log('MockAuth: Login attempt:', credentials.username);
    
    const user = mockUsers.find(u => u.username === credentials.username);
    if (!user) {
      console.log('MockAuth: User not found:', credentials.username);
      const errorMessage = 'User not found or inactive';
      
      // Store error for potential redirect scenarios
      localStorage.setItem('lastLoginError', JSON.stringify({
        message: errorMessage,
        timestamp: new Date().toISOString(),
        type: 'user_not_found'
      }));
      
      return { success: false, message: errorMessage };
    }

    console.log('MockAuth: User found:', user);
    console.log('MockAuth: Stored password for user:', mockPasswords[credentials.username as keyof typeof mockPasswords]);
    console.log('MockAuth: Provided password:', credentials.password);

    // Check password
    const storedPassword = mockPasswords[credentials.username as keyof typeof mockPasswords];
    if (credentials.password !== storedPassword) {
      console.log('MockAuth: Password mismatch');
      const errorMessage = 'Invalid credentials';
      
      // Store error for potential redirect scenarios
      localStorage.setItem('lastLoginError', JSON.stringify({
        message: errorMessage,
        timestamp: new Date().toISOString(),
        type: 'wrong_password'
      }));
      
      return { success: false, message: errorMessage };
    }

    console.log('MockAuth: Password match successful');

    // Create mock token and user data matching real server format
    const mockToken = 'mock_token_' + Date.now();
    const userData = {
      ...user,
      token: mockToken,
      lastLogin: new Date().toISOString()
    };

    // Store token and user data
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    setUser(userData);
    console.log('MockAuth: User set successfully:', userData);

    return { success: true, user: userData, message: 'Login successful (mock mode)' };
  };

  const createUser = async (data: AdminCreateUserData): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Starting user creation for:', data.username, 'with role:', data.role);
      
      // Map the data to match your server's expected format
      const apiData = {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role: data.role
      };
      
      // Validate required fields
      const validationErrors = [];
      if (!apiData.username || apiData.username.trim().length === 0) {
        validationErrors.push('Username is required');
      }
      if (!apiData.email || apiData.email.trim().length === 0) {
        validationErrors.push('Email is required');
      }
      if (!apiData.password || apiData.password.trim().length === 0) {
        validationErrors.push('Password is required');
      }
      if (!apiData.firstName || apiData.firstName.trim().length === 0) {
        validationErrors.push('First name is required');
      }
      if (!apiData.lastName || apiData.lastName.trim().length === 0) {
        validationErrors.push('Last name is required');
      }
      if (!apiData.role) {
        validationErrors.push('Role is required');
      }
      
      if (validationErrors.length > 0) {
        console.log('❌ Validation errors:', validationErrors);
        return { success: false, message: validationErrors.join(', ') };
      }
      
      console.log('AuthContext: Sending API data:', apiData);
      console.log('AuthContext: Full input data:', data);
      
      // Call the appropriate role-specific endpoint
      let response;
      switch (data.role) {
        case 'admin':
          response = await api.auth.createAdmin(apiData);
          break;
        case 'cashier':
          response = await api.auth.createCashier(apiData);
          break;
        case 'kitchen':
          response = await api.auth.createKitchen(apiData);
          break;
        default:
          throw new Error(`Invalid role: ${data.role}`);
      }
      
      const result = await response.json();
      console.log('AuthContext: Create user API response:', result);
      console.log('AuthContext: Response status:', response.status);
      console.log('AuthContext: Response statusText:', response.statusText);

      if (result.success) {
        console.log('AuthContext: User created successfully:', result.data);
        return { success: true, message: result.message || 'User created successfully', data: result.data };
      } else {
        console.log('AuthContext: User creation failed:', result.message || result.error);
        console.log('AuthContext: Full error response:', result);
        return { success: false, message: result.message || result.error || 'User creation failed' };
      }
    } catch (error) {
      console.error('AuthContext: User creation error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const getAllUsers = async (): Promise<{ success: boolean; data?: User[]; message?: string }> => {
    try {
      console.log('AuthContext: Fetching all users');
      
      const response = await api.auth.getAllUsers();
      const result = await response.json();
      console.log('AuthContext: Get all users API response:', result);

      if (result.success) {
        console.log('AuthContext: Users fetched successfully:', result.data);
        return { success: true, data: result.data, message: result.message };
      } else {
        console.log('AuthContext: Failed to fetch users:', result.message);
        return { success: false, message: result.message || 'Failed to fetch users' };
      }
    } catch (error) {
      console.error('AuthContext: Get all users error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const updateUser = async (userId: string, data: AdminUpdateUserData): Promise<{ success: boolean; message: string; data?: User }> => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Updating user:', userId);
      
      // Map the data to match your server's expected format
      const apiData = {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
        isActive: data.isActive
      };
      
      console.log('AuthContext: Sending update data:', apiData);
      
      const response = await api.auth.updateUser(userId, apiData);
      const result = await response.json();
      console.log('AuthContext: Update user API response:', result);

      if (result.success) {
        console.log('AuthContext: User updated successfully:', result.data);
        return { success: true, message: result.message || 'User updated successfully', data: result.data };
      } else {
        console.log('AuthContext: User update failed:', result.message);
        return { success: false, message: result.message || 'User update failed' };
      }
    } catch (error) {
      console.error('AuthContext: User update error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Deleting user:', userId);
      
      const response = await api.auth.deleteUser(userId);
      const result = await response.json();
      console.log('AuthContext: Delete user API response:', result);

      if (result.success) {
        console.log('AuthContext: User deleted successfully');
        return { success: true, message: result.message || 'User deleted successfully' };
      } else {
        console.log('AuthContext: User deletion failed:', result.message);
        return { success: false, message: result.message || 'User deletion failed' };
      }
    } catch (error) {
      console.error('AuthContext: User deletion error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('adminCurrentPage'); // Clear saved admin page
      setUser(null);
      
      // Optionally call logout API if you have one
      // await fetch('http://localhost:3000/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  const changePassword = async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Starting password change');
      
      const response = await api.auth.changePassword(data.currentPassword, data.newPassword);
      const result = await response.json();
      console.log('AuthContext: Change password API response:', result);

      if (result.success) {
        return { success: true, message: result.message || 'Password changed successfully' };
      } else {
        return { success: false, message: result.message || result.error || 'Failed to change password' };
      }
    } catch (error) {
      console.error('AuthContext: Change password error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Starting resend verification for:', email);
      
      const response = await api.auth.resendVerification(email);
      const result = await response.json();
      console.log('AuthContext: Resend verification API response:', result);

      if (result.success) {
        return { success: true, message: result.message || 'Verification email sent successfully' };
      } else {
        return { success: false, message: result.message || result.error || 'Failed to send verification email' };
      }
    } catch (error) {
      console.error('AuthContext: Resend verification error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    logout,
    changePassword,
    resendVerification,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
