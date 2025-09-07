import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://italcjeomaybmbabgmmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YWxjamVvbWF5Ym1iYWJnbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTM1ODksImV4cCI6MjA3MjUyOTU4OX0.zhXcBoVHJPDU0ctXfij6cqviADJ5ZO7ByrupzCWoDYA';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          first_name: string;
          last_name: string;
          role: 'admin' | 'cashier' | 'kitchen' | 'inventory_manager';
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          first_name: string;
          last_name: string;
          role?: 'admin' | 'cashier' | 'kitchen' | 'inventory_manager';
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          role?: 'admin' | 'cashier' | 'kitchen' | 'inventory_manager';
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Storage helper functions
export const storageHelpers = {
  // Get public URL for a file in storage
  getPublicUrl: (bucketName: string, filePath: string) => {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    return data.publicUrl;
  },

  // Upload file to storage
  uploadFile: async (bucketName: string, filePath: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);
    
    if (error) throw error;
    return data;
  },

  // Delete file from storage
  deleteFile: async (bucketName: string, filePath: string) => {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) throw error;
  }
};

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData: {
    username: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'cashier' | 'kitchen';
    phone?: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          phone: userData.phone
        }
      }
    });

    if (error) throw error;

    // Create user profile in user_profiles table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          phone: userData.phone,
          email: email,
          is_active: true
        });

      if (profileError) throw profileError;
    }

    return data;
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Update last login
    if (data.user) {
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
