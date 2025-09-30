import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  id: string;
  username: string;
  email: string;
  role: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data from API
  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Try different API endpoints
      const apiEndpoints = [
        'https://server-resturant-3.onrender.com/api/auth/profile',
        '/api/auth/profile'
      ];

      let response = null;

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying API endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          // Check if response is HTML (error page)
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            console.log(`Endpoint ${endpoint} returned HTML, trying next...`);
            continue;
          }

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setProfileData(result.data);
              return; // Success, exit the function
                    } else {
                      throw new Error(result.message || 'Failed to fetch profile data');
                    }
                  }
                } catch (endpointError) {
                  console.log(`Endpoint ${endpoint} failed:`, endpointError);
                  continue;
                }
      }

      // If all endpoints failed, use fallback data from context
      if (user) {
        console.log('Using fallback user data from context');
        setProfileData({
          id: user.id || 'unknown',
          username: user.username || user.email || 'unknown',
          email: user.email || 'unknown',
          role: user.role || 'unknown',
          firstName: user.firstName,
          lastName: user.lastName,
                      phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      } else {
        throw new Error('No user data available and API endpoints failed');
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  // Handle modal close
  const handleClose = () => {
    setProfileData(null);
    setError(null);
    onClose();
  };

  // Get role display name and color
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { name: 'Administrator', color: 'bg-red-100 text-red-800' };
      case 'cashier':
        return { name: 'Cashier', color: 'bg-blue-100 text-blue-800' };
      case 'kitchen':
        return { name: 'Kitchen Staff', color: 'bg-green-100 text-green-800' };
      default:
        return { name: role, color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Profile
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading profile...</span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Token: {localStorage.getItem('authToken') ? 'Present' : 'Missing'}
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* Profile data */}
            {profileData && !isLoading && (
              <div className="space-y-4">
                {/* Profile header */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {profileData.firstName && profileData.lastName 
                        ? `${profileData.firstName} ${profileData.lastName}`
                        : profileData.username
                      }
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleInfo(profileData.role).color}`}>
                      {getRoleInfo(profileData.role).name}
                    </span>
                  </div>
                </div>

                {/* Profile details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Username</p>
                      <p className="text-sm text-gray-600">{profileData.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{profileData.email}</p>
                    </div>
                  </div>

                  {profileData.phone && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{profileData.phone}</p>
                      </div>
                    </div>
                  )}

                  {profileData.address && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-600">{profileData.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">User ID</p>
                      <p className="text-sm text-gray-600 font-mono">{profileData.id}</p>
                    </div>
                  </div>

                  {profileData.createdAt && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Member Since</p>
                        <p className="text-sm text-gray-600">
                          {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
