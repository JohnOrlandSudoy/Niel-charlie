import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChangePasswordData } from '../../types/auth';
import { calculatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthWidth } from '../../utils/passwordStrength';

interface ChangePasswordProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onClose, onSuccess }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { changePassword } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<ChangePasswordData & { confirmPassword: string }>();

  const newPassword = watch('newPassword');
  const passwordStrength = newPassword ? calculatePasswordStrength(newPassword) : null;

  const onSubmit = async (data: ChangePasswordData & { confirmPassword: string }) => {
    try {
      setIsLoading(true);
      setError('');
      
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (result.success) {
        setIsSuccess(true);
        reset();
        if (onSuccess) {
          onSuccess();
        }
        // Auto-close after 2 seconds if onClose is provided
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Password changed successfully
        </h3>
        <p className="text-sm text-gray-600">
          Your password has been updated successfully.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
        <p className="mt-1 text-sm text-gray-600">
          Update your password to keep your account secure.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <div className="mt-1 relative">
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('currentPassword', { 
                required: 'Current password is required'
              })}
              className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                errors.currentPassword ? 'border-red-300' : 'border-gray-300'
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              placeholder="Enter your current password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200 z-10"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="mt-1 relative">
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('newPassword', { 
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
              })}
              className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                errors.newPassword ? 'border-red-300' : 'border-gray-300'
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              placeholder="Enter your new password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200 z-10"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
          )}

          {/* Password Strength Indicator */}
          {newPassword && passwordStrength && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Password strength:</span>
                <span className={`font-medium ${passwordStrength.color}`}>
                  {passwordStrength.level}
                </span>
              </div>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                  style={{ width: getPasswordStrengthWidth(passwordStrength.score) }}
                />
              </div>
              {passwordStrength.feedback.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>Password should include:</p>
                  <ul className="list-disc list-inside mt-1">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('confirmPassword', { 
                required: 'Please confirm your new password',
                validate: value => value === newPassword || 'Passwords do not match'
              })}
              className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200 z-10"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
