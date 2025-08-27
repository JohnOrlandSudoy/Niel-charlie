import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../utils/auth';
import { User, LoginCredentials, SignUpData, AuthContextType } from '../types/auth';

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
        const session = AuthService.getSession();
        if (session) {
          setUser(session);
        }
      } catch (error) {
        console.error('Error checking session:', error);
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
      
      const result = await AuthService.login(credentials);
      console.log('AuthContext: Login result:', result);
      
      if (result.success && result.user) {
        setUser(result.user);
        console.log('AuthContext: User set successfully:', result.user);
      } else {
        console.log('AuthContext: Login failed:', result.message);
      }
      
      return result;
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
      const result = await AuthService.signup(data);
      
      if (result.success && result.user) {
        setUser(result.user);
      }
      
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.clearSession();
    setUser(null);
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
