'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  });
  const router = useRouter();

  // Get user ID from localStorage
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          return parsed.id || parsed._id;
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }
    }
    return null;
  };

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      
      const userId = getUserId();
      if (!userId) {
        setError('Not authenticated. Please login.');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'x-user-id': userId
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch profile');
        }
        
        setUser(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'An error occurred while fetching your profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setMessage(null);
    
    const userId = getUserId();
    if (!userId) {
      setError('Not authenticated. Please login.');
      setUpdating(false);
      return;
    }
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Update the user state with the new data
      setUser(data.user);
      
      // Update localStorage with the new user data
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            const updatedUser = {
              ...parsedUser,
              full_name: data.user.full_name,
              phone: data.user.phone
            };
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
          } catch (e) {
            console.error('Error updating localStorage:', e);
          }
        }
      }
      
      setMessage('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setUpdating(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
      // Remove any other auth-related items
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
    }
    router.push('/login');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Profile Header */}
      <div className="bg-blue-900 text-white px-6 py-5">
        <h1 className="text-xl font-bold">Your Profile</h1>
        <p className="text-blue-100 text-sm mt-1">Manage your personal information</p>
      </div>

      {/* Alert Messages */}
      <div className="px-6 pt-6">
        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{message}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-10 w-10 text-blue-900 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-blue-900">Loading your profile...</p>
            </div>
          </div>
        ) : user ? (
          <div>
            {/* User Info Card */}
            <div className="mt-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-900 text-white h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">{user.full_name || 'Account User'}</h2>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>
            
            {/* Edit Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="full_name">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <button
                  type="submit"
                  className="flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : 'Update Profile'}
                </button>
                
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-900 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load profile</h3>
            <p className="text-gray-600 mb-6">Please login again to access your profile information.</p>
            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}