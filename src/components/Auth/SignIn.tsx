import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth';

const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginCredentials>();

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      try {
        const { username, password, rememberMe: savedRememberMe } = JSON.parse(savedCredentials);
        if (savedRememberMe) {
          setValue('username', username);
          setValue('password', password);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
        localStorage.removeItem('rememberedCredentials');
      }
    }

    // Check for lockout status
    const lockoutData = localStorage.getItem('loginLockout');
    if (lockoutData) {
      try {
        const { attempts, lockoutUntil } = JSON.parse(lockoutData);
        const lockoutDate = new Date(lockoutUntil);
        if (lockoutDate > new Date()) {
          setIsLocked(true);
          setLockoutTime(lockoutDate);
          setLoginAttempts(attempts);
        } else {
          // Lockout expired, clear it
          localStorage.removeItem('loginLockout');
        }
      } catch (error) {
        console.error('Error loading lockout data:', error);
        localStorage.removeItem('loginLockout');
      }
    }

    // Check for error messages from URL parameters or localStorage
    const errorParam = searchParams.get('error');
    const errorType = searchParams.get('errorType');
    const lastLoginError = localStorage.getItem('lastLoginError');
    
    if (errorParam) {
      // Show error from URL parameter
      setError(`❌ ${decodeURIComponent(errorParam)}`);
      // Clear the URL parameter
      setSearchParams({});
    } else if (lastLoginError) {
      // Show error from localStorage (for page reloads)
      const errorData = JSON.parse(lastLoginError);
      let errorMessage = errorData.message;
      
      // Enhance error message based on type
      if (errorData.type === 'network') {
        errorMessage = '🌐 Network error. Please check your internet connection and try again.';
      } else if (errorData.type === 'unauthorized' || errorData.type === 'session_expired') {
        errorMessage = '❌ Session expired. Please sign in again.';
      } else if (errorData.type === 'server') {
        errorMessage = '🔧 Server error. Please try again later or contact support.';
      } else if (errorData.type === 'user_not_found') {
        errorMessage = '❌ Username not found. Please check your username and try again.';
      } else if (errorData.type === 'wrong_password') {
        errorMessage = '❌ Incorrect password. Please check your password and try again.';
      }
      
      setError(errorMessage);
      
      // Show browser alert for critical errors
      if (errorData.type === 'network' || errorData.type === 'server') {
        alert(`Authentication Error:\n\n${errorMessage}\n\nPlease check your connection and try again.`);
      }
      
      // Clear the stored error
      localStorage.removeItem('lastLoginError');
    }
  }, [setValue, searchParams, setSearchParams]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle Remember Me checkbox change
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      // Clear saved credentials when unchecked
      localStorage.removeItem('rememberedCredentials');
    }
  };

  // Helper function to validate credentials format
  const validateCredentials = (username: string, password: string) => {
    const errors: string[] = [];
    
    if (!username || username.trim().length === 0) {
      errors.push('Username is required');
    }
    
    if (!password || password.trim().length === 0) {
      errors.push('Password is required');
    }
    
    if (username && username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (password && password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    return errors;
  };

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      // Check if account is locked
      if (isLocked && lockoutTime && lockoutTime > new Date()) {
        const remainingTime = Math.ceil((lockoutTime.getTime() - new Date().getTime()) / 1000 / 60);
        setError(`Account temporarily locked. Please try again in ${remainingTime} minutes.`);
        return;
      }
      
      // Trim whitespace from inputs
      const trimmedData = {
        username: data.username.trim(),
        password: data.password.trim(),
        rememberMe: rememberMe
      };
      
      // Validate credentials format
      const validationErrors = validateCredentials(trimmedData.username, trimmedData.password);
      if (validationErrors.length > 0) {
        setError(`❌ ${validationErrors.join(', ')}`);
        return;
      }
      
      console.log('SignIn: Form submitted with data:', trimmedData);
      
      const result = await login(trimmedData);
      console.log('SignIn: Login result:', result);
      
      if (result.success) {
        console.log('SignIn: Login successful, redirecting...');
        
        // Handle Remember Me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            username: trimmedData.username,
            password: trimmedData.password,
            rememberMe: true
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }
        
        // Clear any lockout data on successful login
        localStorage.removeItem('loginLockout');
        setLoginAttempts(0);
        setIsLocked(false);
        setLockoutTime(null);
        
        setSuccess('Login successful! Redirecting...');
        
        // Small delay to show success message
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        console.log('SignIn: Login failed:', result.message);
        
        // Handle failed login attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Enhanced error handling with specific messages
        let errorMessage = result.message;
        
        // Check for specific error types and provide user-friendly messages
        if (result.message.toLowerCase().includes('user not found') || result.message.toLowerCase().includes('inactive')) {
          errorMessage = '❌ User not found or inactive. Please check your username and try again.';
        } else if (result.message.toLowerCase().includes('invalid credentials')) {
          errorMessage = '❌ Invalid credentials. Please check your username and password.';
        } else if (result.message.toLowerCase().includes('incorrect password') || result.message.toLowerCase().includes('invalid password')) {
          errorMessage = '❌ Incorrect password. Please check your password and try again.';
        } else if (result.message.toLowerCase().includes('unauthorized') || result.message.toLowerCase().includes('authentication')) {
          errorMessage = '❌ Authentication failed. Please verify your credentials.';
        } else if (result.message.toLowerCase().includes('network') || result.message.toLowerCase().includes('connection')) {
          errorMessage = '🌐 Network error. Please check your internet connection and try again.';
        } else if (result.message.toLowerCase().includes('server') || result.message.toLowerCase().includes('internal')) {
          errorMessage = '🔧 Server error. Please try again later or contact support.';
        } else if (result.message.toLowerCase().includes('account') && result.message.toLowerCase().includes('locked')) {
          errorMessage = '🔒 Account is temporarily locked. Please try again later.';
        } else if (result.message.toLowerCase().includes('inactive') || result.message.toLowerCase().includes('disabled')) {
          errorMessage = '⚠️ Account is inactive. Please contact your administrator.';
        } else {
          // Default fallback for unknown errors
          errorMessage = `❌ ${result.message}`;
        }
        
        // Implement lockout after 5 failed attempts
        if (newAttempts >= 5) {
          const lockoutUntil = new Date();
          lockoutUntil.setMinutes(lockoutUntil.getMinutes() + 15); // 15 minute lockout
          
          localStorage.setItem('loginLockout', JSON.stringify({
            attempts: newAttempts,
            lockoutUntil: lockoutUntil.toISOString()
          }));
          
          setIsLocked(true);
          setLockoutTime(lockoutUntil);
          errorMessage += `\n\n🔒 Account locked for 15 minutes due to multiple failed attempts.`;
        } else if (newAttempts >= 3) {
          errorMessage += `\n\n⚠️ ${5 - newAttempts} attempts remaining before account lockout.`;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('SignIn: Unexpected error:', error);
      setError('💥 An unexpected error occurred. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-24 w-24 flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Restaurant Logo" 
              className="h-24 w-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Contact your administrator to create a new account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{success}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 whitespace-pre-line">{error}</p>
                    {loginAttempts > 0 && loginAttempts < 5 && (
                      <p className="text-xs text-red-600 mt-1">
                        Failed attempts: {loginAttempts}/5
                      </p>
                    )}
                    {error.includes('User not found') && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        💡 <strong>Tip:</strong> Make sure you're using the correct username. Contact your administrator if you need help.
                      </div>
                    )}
                    {error.includes('Invalid credentials') && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        💡 <strong>Tip:</strong> Check your username and password. Use the eye icon to verify what you've typed.
                      </div>
                    )}
                    {error.includes('Incorrect password') && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        💡 <strong>Tip:</strong> Check for typos in your password. Use the eye icon to verify what you've typed.
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Lockout Warning */}
          {isLocked && lockoutTime && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    Account temporarily locked
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Please try again after {lockoutTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                {...register('username', { 
                  required: 'Username or email is required' 
                })}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your username or email"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { 
                    required: 'Password is required' 
                  })}
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200 z-10"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || (isLocked && lockoutTime ? lockoutTime > new Date() : false)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : isLocked && lockoutTime && lockoutTime > new Date() ? (
                <>
                  <AlertTriangle className="-ml-1 mr-2 h-4 w-4" />
                  Account Locked
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => handleRememberMeChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                Remember me
                {rememberMe && (
                  <span className="ml-1 text-xs text-blue-600 font-medium">
                    (credentials saved)
                  </span>
                )}
              </label>
            </div>
            {loginAttempts > 0 && (
              <div className="text-xs text-gray-500">
                Attempts: {loginAttempts}/5
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default SignIn;
