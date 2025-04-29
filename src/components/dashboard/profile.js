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
    }
    router.push('/login');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : user ? (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Account Information</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Member since:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="full_name">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={updating}
              >
                {updating ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : 'Update Profile'}
              </button>
              
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-red-600">Unable to load profile. Please login again.</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
}