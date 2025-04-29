"use client";

import { useState, useEffect } from 'react';

export default function UserDetailsPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    skills: [],
    qualifications: [],
    interests: [],
    is_subscribed: false
  });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/user-details', {
          headers: {
            'x-user-id': '6811068b560fea22c3edea3d'
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
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch user details: ' + err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
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
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '6811068b560fea22c3edea3d'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user details');
      }

      setUserData({
        ...userData,
        ...formData
      });
      setMessage('User details saved successfully!');
    } catch (err) {
      setError('Failed to save user details: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl font-semibold">Loading user details...</p>
    </div>;
  }

  if (error && !userData) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl font-semibold text-red-500">{error}</p>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">User Details</h1>
      
      {userData && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Current Details</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {userData.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Qualifications</h3>
              <ul className="list-disc pl-5">
                {userData.qualifications.map((qualification, index) => (
                  <li key={index} className="mb-1">{qualification}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {userData.interests.map((interest, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Subscription Status</h3>
              <p className={userData.is_subscribed ? "text-green-600 font-medium" : "text-gray-600"}>
                {userData.is_subscribed ? "Subscribed" : "Not Subscribed"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Update Details</h2>
        
        {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{message}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills.join(', ')}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="JavaScript, React, Node.js, MongoDB"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications (comma separated)</label>
            <input
              type="text"
              name="qualifications"
              value={formData.qualifications.join(', ')}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="B.Sc. Computer Science, Web Development Bootcamp"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interests (comma separated)</label>
            <input
              type="text"
              name="interests"
              value={formData.interests.join(', ')}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Frontend Development, Mobile Apps, DevOps"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_subscribed"
              checked={formData.is_subscribed}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Subscribe to premium features</label>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Save Details'}
          </button>
        </form>
      </div>
    </div>
  );
}