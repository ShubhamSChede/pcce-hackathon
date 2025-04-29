// src/app/components/JobListings.jsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function JobListings() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [userInterests, setUserInterests] = useState({});
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return;
      }

      setJobs(jobsData || []);

      // If user is authenticated, fetch their job interests
      if (session) {
        setUser(session.user);
        
        const { data: interestsData, error: interestsError } = await supabase
          .from('user_job_interests')
          .select('*')
          .eq('user_id', session.user.id);

        if (!interestsError && interestsData) {
          // Convert to object for easy lookup
          const interests = {};
          interestsData.forEach(interest => {
            interests[interest.job_id] = interest.status;
          });
          setUserInterests(interests);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleJobInterest = async (jobId, status) => {
    if (!user) {
      setMessage('Please sign in to save job interests');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const existingStatus = userInterests[jobId];
      
      if (existingStatus) {
        if (existingStatus === status) {
          // Remove interest if clicking the same status
          await supabase
            .from('user_job_interests')
            .delete()
            .eq('user_id', user.id)
            .eq('job_id', jobId);
          
          setUserInterests(prev => {
            const updated = {...prev};
            delete updated[jobId];
            return updated;
          });
        } else {
          // Update interest status
          await supabase
            .from('user_job_interests')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('job_id', jobId);
          
          setUserInterests(prev => ({...prev, [jobId]: status}));
        }
      } else {
        // Insert new interest
        await supabase
          .from('user_job_interests')
          .insert({
            user_id: user.id,
            job_id: jobId,
            status,
          });
        
        setUserInterests(prev => ({...prev, [jobId]: status}));
      }
    } catch (error) {
      setMessage(`Error updating job interest: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading job listings...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <h2 className="text-2xl font-bold mb-6">Job Opportunities</h2>
      
      {message && (
        <div className={`mb-4 p-2 text-sm ${message.includes('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'} rounded`}>
          {message}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <p className="text-gray-700 font-medium">{job.company}</p>
              <p className="text-gray-600">{job.location}</p>
              {job.salary_range && <p className="text-gray-600">{job.salary_range}</p>}
              
              <div className="mt-2 flex flex-wrap gap-2">
                {job.tags?.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="mt-4">
                <Link 
                  href={`/jobs/${job.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View Details
                </Link>
              </div>
              
              {user && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleJobInterest(job.id, 'saved')}
                    className={`px-3 py-1 text-sm rounded ${
                      userInterests[job.id] === 'saved' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {userInterests[job.id] === 'saved' ? 'Saved ✓' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleJobInterest(job.id, 'interested')}
                    className={`px-3 py-1 text-sm rounded ${
                      userInterests[job.id] === 'interested' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {userInterests[job.id] === 'interested' ? 'Interested ✓' : 'Interested'}
                  </button>
                  <button
                    onClick={() => handleJobInterest(job.id, 'applied')}
                    className={`px-3 py-1 text-sm rounded ${
                      userInterests[job.id] === 'applied' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {userInterests[job.id] === 'applied' ? 'Applied ✓' : 'Applied'}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center p-8 bg-gray-50 rounded-lg">
            No job opportunities available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}