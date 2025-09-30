// Configuration utility for environment variables
// This centralizes all environment variable access and provides fallbacks

export const config = {
  // Application Configuration
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    name: import.meta.env.VITE_APP_NAME || 'Restaurant Admin Dashboard',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://server-resturant-3.onrender.com/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  },

  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://italcjeomaybmbabgmmq.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YWxjamVvbWF5Ym1iYWJnbW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTM1ODksImV4cCI6MjA3MjUyOTU4OX0.zhXcBoVHJPDU0ctXfij6cqviADJ5ZO7ByrupzCWoDYA',
  },

  // PayMongo Configuration
  paymongo: {
    publicKey: import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || '',
    environment: import.meta.env.VITE_PAYMONGO_ENVIRONMENT || 'test',
  },

  // Authentication Configuration
  auth: {
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '480'), // minutes
    rememberMeDuration: parseInt(import.meta.env.VITE_REMEMBER_ME_DURATION || '30'), // days
  },

  // Security Configuration
  security: {
    corsOrigins: import.meta.env.VITE_CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    rateLimit: parseInt(import.meta.env.VITE_RATE_LIMIT || '100'),
  },

  // Restaurant Configuration
  restaurant: {
    name: import.meta.env.VITE_RESTAURANT_NAME || 'Your Restaurant',
    address: import.meta.env.VITE_RESTAURANT_ADDRESS || 'Your Restaurant Address',
    phone: import.meta.env.VITE_RESTAURANT_PHONE || '+1-234-567-8900',
    email: import.meta.env.VITE_RESTAURANT_EMAIL || 'info@your-restaurant.com',
    businessHours: {
      start: import.meta.env.VITE_BUSINESS_HOURS_START || '09:00',
      end: import.meta.env.VITE_BUSINESS_HOURS_END || '22:00',
    },
    currency: import.meta.env.VITE_CURRENCY || 'PHP',
    currencySymbol: import.meta.env.VITE_CURRENCY_SYMBOL || '₱',
    timezone: import.meta.env.VITE_TIMEZONE || 'Asia/Manila',
  },

  // Feature Flags
  features: {
    offlineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
    paymongo: import.meta.env.VITE_ENABLE_PAYMONGO === 'true',
    supabase: import.meta.env.VITE_ENABLE_SUPABASE === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
    pushNotifications: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true',
    serviceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
  },

  // Performance Configuration
  performance: {
    cacheDuration: parseInt(import.meta.env.VITE_CACHE_DURATION || '3600'), // seconds
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10'), // MB
    allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
  },

  // Logging Configuration
  logging: {
    level: import.meta.env.VITE_LOG_LEVEL || 'info',
    enableConsole: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
  },

  // Development Configuration
  development: {
    hotReload: import.meta.env.VITE_HOT_RELOAD === 'true',
    sourceMaps: import.meta.env.VITE_SOURCE_MAPS === 'true',
  },

  // Deployment Configuration
  deployment: {
    buildDir: import.meta.env.VITE_BUILD_DIR || 'dist',
    publicPath: import.meta.env.VITE_PUBLIC_PATH || '/',
    enableGzip: import.meta.env.VITE_ENABLE_GZIP === 'true',
  },

  // Third-party Integrations
  integrations: {
    googleMaps: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    googleAnalytics: import.meta.env.VITE_GA_TRACKING_ID || '',
    sentry: import.meta.env.VITE_SENTRY_DSN || '',
    facebook: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    google: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  },

  // Security Headers
  securityHeaders: {
    csp: import.meta.env.VITE_CSP_POLICY || "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
  },
};

// Helper functions
export const isDevelopment = () => config.app.env === 'development';
export const isProduction = () => config.app.env === 'production';
export const isStaging = () => config.app.env === 'staging';

// Validation function
export const validateConfig = () => {
  const errors: string[] = [];

  // Check required configurations
  if (!config.api.baseUrl) {
    errors.push('VITE_API_BASE_URL is required');
  }

  if (!config.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }

  if (!config.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  if (config.features.paymongo && !config.paymongo.publicKey) {
    errors.push('VITE_PAYMONGO_PUBLIC_KEY is required when PayMongo is enabled');
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
    if (isProduction()) {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }
  }

  return errors.length === 0;
};

// Initialize configuration validation
if (typeof window !== 'undefined') {
  validateConfig();
}

export default config;
