"use client";

import { useState, useEffect } from 'react';

export default function CareerDetails() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    skills: [],
    qualifications: [],
    interests: [],
    is_subscribed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get userId from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('user_id');
      
      if (storedUserId) {
        setUserId(storedUserId);
        
        // Check if subscription state is stored in localStorage
        const storedSubscription = localStorage.getItem(`subscription_${storedUserId}`);
        if (storedSubscription) {
          try {
            const isSubscribed = JSON.parse(storedSubscription);
            setFormData(prevData => ({
              ...prevData,
              is_subscribed: isSubscribed
            }));
          } catch (e) {
            console.error('Error parsing subscription data from localStorage:', e);
          }
        }
      } else {
        setError('User not authenticated. Please log in.');
      }
    }
  }, []);

  // Fetch user data once we have the userId
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch('/api/user-details', {
          headers: {
            'x-user-id': userId
          }
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setUserData(data);
        
        // Initialize form data with user data
        setFormData({
          skills: data.skills || [],
          qualifications: data.qualifications || [],
          interests: data.interests || [],
          is_subscribed: data.is_subscribed || false
        });
        
        // Store subscription state in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`subscription_${userId}`, JSON.stringify(data.is_subscribed));
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch career details: ' + err.message);
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prevData => {
        const newData = {
          ...prevData,
          [name]: checked
        };
        
        // When subscription status changes, update localStorage immediately
        if (name === 'is_subscribed' && userId) {
          localStorage.setItem(`subscription_${userId}`, JSON.stringify(checked));
        }
        
        return newData;
      });
    } else if (name === 'skills' || name === 'qualifications' || name === 'interests') {
      // Convert comma-separated string to array
      setFormData({
        ...formData,
        [name]: value.split(',').map(item => item.trim()).filter(Boolean)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save career details');
      }

      // Update userData state with the new data
      setUserData({
        ...userData,
        ...formData
      });
      
      // Store user profile in localStorage
      localStorage.setItem(`skills_${userId}`, JSON.stringify(formData.skills));
      localStorage.setItem(`qualifications_${userId}`, JSON.stringify(formData.qualifications));
      localStorage.setItem(`interests_${userId}`, JSON.stringify(formData.interests));
      localStorage.setItem(`subscription_${userId}`, JSON.stringify(formData.is_subscribed));
      
      // Display success message
      setMessage('Career details saved successfully!');
    } catch (err) {
      setError('Failed to save career details: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a utility function to check if user is subscribed
  const isUserSubscribed = () => {
    if (userData && userData.is_subscribed) return true;
    if (formData.is_subscribed) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Career Details Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-900 text-white px-6 py-5">
          <h1 className="text-xl font-bold">Career Profile</h1>
          <p className="text-blue-100 text-sm mt-1">Manage your professional details</p>
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

        {/* Content Section */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-10 w-10 text-blue-900 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-blue-900">Loading your career details...</p>
              </div>
            </div>
          ) : (
            userData && (
              <div className="pt-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Professional Profile</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-blue-900 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.skills && userData.skills.length > 0 ? (
                        userData.skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No skills added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-blue-900 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                      Qualifications
                    </h3>
                    {userData.qualifications && userData.qualifications.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {userData.qualifications.map((qualification, index) => (
                          <li key={index} className="text-gray-700 text-sm">{qualification}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No qualifications added yet</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-blue-900 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.interests && userData.interests.length > 0 ? (
                        userData.interests.map((interest, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No interests added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-blue-900 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Subscription Status
                    </h3>
                    <div className="flex items-center">
                      {isUserSubscribed() ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-900">
                          <svg className="mr-1.5 h-2 w-2 text-blue-900" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Premium Subscription Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          <svg className="mr-1.5 h-2 w-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          Basic Account
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Update Form Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-900 text-white px-6 py-5">
          <h1 className="text-xl font-bold">Update Career Details</h1>
          <p className="text-blue-100 text-sm mt-1">Enhance your professional profile</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="skills">
                Skills (comma separated)
              </label>
              <input
                id="skills"
                type="text"
                name="skills"
                value={formData.skills.join(', ')}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                placeholder="JavaScript, React, Node.js, MongoDB"
              />
              <p className="mt-1 text-xs text-gray-500">Add the technical and soft skills you possess</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="qualifications">
                Qualifications (comma separated)
              </label>
              <input
                id="qualifications"
                type="text"
                name="qualifications"
                value={formData.qualifications.join(', ')}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                placeholder="B.Sc. Computer Science, Web Development Bootcamp"
              />
              <p className="mt-1 text-xs text-gray-500">List your academic degrees, certifications, and training</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="interests">
                Interests (comma separated)
              </label>
              <input
                id="interests"
                type="text"
                name="interests"
                value={formData.interests.join(', ')}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                placeholder="Frontend Development, Mobile Apps, DevOps"
              />
              <p className="mt-1 text-xs text-gray-500">Share your professional interests and career focus areas</p>
            </div>
            
            <div className="flex items-center">
              <input
                id="is_subscribed"
                type="checkbox"
                name="is_subscribed"
                checked={formData.is_subscribed}
                onChange={handleChange}
                className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300 rounded"
              />
              <label htmlFor="is_subscribed" className="ml-2 block text-sm text-gray-700">
                Subscribe to premium features
              </label>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !userId}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : 'Save Career Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}