import bcrypt from 'bcryptjs';
import { User, UserRole, LoginCredentials, SignUpData } from '../types/auth';

// Mock users database - In production, this would be replaced with Supabase
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@restaurant.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    username: 'cashier',
    email: 'cashier@restaurant.com',
    role: 'cashier',
    firstName: 'Cashier',
    lastName: 'User',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    username: 'kitchen',
    email: 'kitchen@restaurant.com',
    role: 'kitchen',
    firstName: 'Kitchen',
    lastName: 'User',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T08:45:00Z'
  }
];

// Mock passwords - In production, these would be stored hashed in Supabase
const mockPasswords = {
  'admin': 'admin123',
  'cashier': 'cashier123',
  'kitchen': 'kitchen123'
};

// Session storage key
const SESSION_KEY = 'restaurant_auth_session';

/**
 * Mock authentication service
 * TODO: Replace with Supabase Auth integration
 */
export class AuthService {
  /**
   * Authenticate user with username and password
   * Future: Replace with Supabase Auth signInWithPassword
   */
  static async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Login attempt:', credentials.username);
      
      const user = mockUsers.find(u => u.username === credentials.username);
      if (!user) {
        console.log('User not found:', credentials.username);
        return { success: false, message: 'Invalid username or password' };
      }

      console.log('User found:', user);
      console.log('Stored password for user:', mockPasswords[credentials.username as keyof typeof mockPasswords]);
      console.log('Provided password:', credentials.password);

      // Check password (in production, this would be handled by Supabase)
      const storedPassword = mockPasswords[credentials.username as keyof typeof mockPasswords];
      if (credentials.password !== storedPassword) {
        console.log('Password mismatch');
        return { success: false, message: 'Invalid username or password' };
      }

      console.log('Password match successful');

      // Update last login
      user.lastLogin = new Date().toISOString();

      // Store session
      this.setSession(user);

      console.log('Session stored, returning success');

      return { success: true, user, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  }

  /**
   * Register new user
   * Future: Replace with Supabase Auth signUp
   */
  static async signup(data: SignUpData): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if username already exists
      if (mockUsers.find(u => u.username === data.username)) {
        return { success: false, message: 'Username already exists' };
      }

      // Check if email already exists
      if (mockUsers.find(u => u.email === data.email)) {
        return { success: false, message: 'Email already exists' };
      }

      // Hash password (in production, Supabase would handle this)
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        username: data.username,
        email: data.email,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: new Date().toISOString()
      };

      // Add to mock database
      mockUsers.push(newUser);
      mockPasswords[data.username as keyof typeof mockPasswords] = data.password;

      // Store session
      this.setSession(newUser);

      return { success: true, user: newUser, message: 'Registration successful' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  }

  /**
   * Get current session
   * Future: Replace with Supabase Auth getSession
   */
  static getSession(): User | null {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Set session
   * Future: Replace with Supabase Auth setSession
   */
  static setSession(user: User): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting session:', error);
    }
  }

  /**
   * Clear session
   * Future: Replace with Supabase Auth signOut
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Check if user has required role
   */
  static hasRole(user: User | null, requiredRoles: UserRole[]): boolean {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }

  /**
   * Get dashboard route based on user role
   */
  static getDashboardRoute(role: UserRole): string {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'cashier':
        return '/cashier';
      case 'kitchen':
        return '/kitchen';
      default:
        return '/';
    }
  }
}

/**
 * Future Supabase integration placeholders:
 * 
 * 1. Replace AuthService.login with:
 *    const { data, error } = await supabase.auth.signInWithPassword({
 *      email: credentials.email,
 *      password: credentials.password
 *    });
 * 
 * 2. Replace AuthService.signup with:
 *    const { data, error } = await supabase.auth.signUp({
 *      email: data.email,
 *      password: data.password,
 *      options: {
 *        data: {
 *           first_name: data.firstName,
 *           last_name: data.lastName,
 *           role: data.role
 *        }
 *      }
 *    });
 * 
 * 3. Store user roles in a separate Supabase table:
 *    CREATE TABLE user_roles (
 *      id UUID REFERENCES auth.users(id),
 *      role TEXT NOT NULL,
 *       first_name TEXT,
 *       last_name TEXT,
 *       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 *    );
 * 
 * 4. Replace session management with Supabase Auth:
 *    - getSession() -> supabase.auth.getSession()
 *    - setSession() -> supabase.auth.setSession()
 *    - clearSession() -> supabase.auth.signOut()
 */
