export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLogin?: string;
}

export type UserRole = 'admin' | 'cashier' | 'kitchen';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  signup: (data: SignUpData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}
