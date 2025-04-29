// src/app/components/UserDetailsForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function UserDetailsForm() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [interests, setInterests] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data, error } = await supabase
          .from('user_details')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setSkills(data.skills?.join(', ') || '');
          setQualifications(data.qualifications?.join(', ') || '');
          setInterests(data.interests?.join(', ') || '');
          setIsSubscribed(data.is_subscribed || false);
        }
      }
      setLoading(false);
    };

    getUser();
  }, [supabase]);

  const updateUserDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Convert comma-separated strings to arrays
      const skillsArray = skills.split(',').map(item => item.trim()).filter(Boolean);
      const qualificationsArray = qualifications.split(',').map(item => item.trim()).filter(Boolean);
      const interestsArray = interests.split(',').map(item => item.trim()).filter(Boolean);

      // Check if the user details already exist
      const { data: existingData } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', user.id)
        .single();

      let response;
      if (existingData) {
        // Update existing record
        response = await supabase
          .from('user_details')
          .update({
            skills: skillsArray,
            qualifications: qualificationsArray,
            interests: interestsArray,
            is_subscribed: isSubscribed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } else {
        // Insert new record
        response = await supabase
          .from('user_details')
          .insert({
            id: user.id,
            skills: skillsArray,
            qualifications: qualificationsArray,
            interests: interestsArray,
            is_subscribed: isSubscribed,
          });
      }

      if (response.error) throw response.error;
      setMessage('Details updated successfully!');
    } catch (error) {
      setMessage(`Error updating details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to view this page</div>;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Professional Details</h2>
      <form onSubmit={updateUserDetails} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="JavaScript, React, Node.js"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Qualifications (comma separated)</label>
          <input
            type="text"
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            placeholder="Bachelor's in CS, AWS Certified Developer"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Career Interests (comma separated)</label>
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="Web Development, Data Science, UI/UX"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSubscribed}
            onChange={(e) => setIsSubscribed(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Subscribe to premium features
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Saving...' : 'Save Details'}
        </button>
      </form>
      {message && (
        <div className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
