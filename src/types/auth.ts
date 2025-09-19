export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'cashier' | 'kitchen';

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminCreateUserData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface AdminUpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string;
  isActive?: boolean;
}


export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  createUser: (data: AdminCreateUserData) => Promise<{ success: boolean; message: string; data?: any }>;
  getAllUsers: () => Promise<{ success: boolean; data?: User[]; message?: string }>;
  updateUser: (userId: string, data: AdminUpdateUserData) => Promise<{ success: boolean; message: string; data?: User }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; message: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}
