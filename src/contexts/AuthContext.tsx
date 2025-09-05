import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, SignUpData, AuthContextType } from '../types/auth';
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
      setIsLoading(true);
      console.log('AuthContext: Starting login for:', credentials.username);
      
      // Call your API server
      const response = await api.auth.login(credentials);
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
        console.log('AuthContext: Login failed:', result.message);
        return { success: false, message: result.message || 'Login failed' };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignUpData): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Starting signup for:', data.username);
      
      // Map the data to match API expectations
      const apiData = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null
      };
      
      console.log('AuthContext: Sending API data:', apiData);
      
      // Call your API server for registration
      const response = await api.auth.register(apiData);
      const result = await response.json();
      console.log('AuthContext: Signup API response:', result);

      if (result.success && result.data) {
        // Store token and user data
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('userData', JSON.stringify(result.data.user));
        
        setUser(result.data.user);
        console.log('AuthContext: User created successfully:', result.data.user);
        return { success: true, message: result.message || 'Account created successfully' };
      } else {
        console.log('AuthContext: Signup failed:', result.message || result.error);
        return { success: false, message: result.message || result.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('AuthContext: Signup error:', error);
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
      setUser(null);
      
      // Optionally call logout API if you have one
      // await fetch('http://localhost:3000/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
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
