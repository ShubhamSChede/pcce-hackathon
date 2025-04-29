// src/app/components/JobDetail.jsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function JobDetail({ jobId }) {
  const supabase = createClientComponentClient();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [jobInterest, setJobInterest] = useState(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('job_opportunities')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.error('Error fetching job:', jobError);
        setLoading(false);
        return;
      }

      setJob(jobData);

      // If user is authenticated, fetch their interest for this job
      if (session) {
        const { data: interestData } = await supabase
          .from('user_job_interests')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('job_id', jobId)
          .single();

        if (interestData) {
          setJobInterest(interestData.status);
          setNotes(interestData.notes || '');
        }
      }

      setLoading(false);
    };

    if (jobId) {
      fetchData();
    }
  }, [supabase, jobId]);

  const handleJobInterest = async (status) => {
    if (!user) {
      setMessage('Please sign in to save job interests');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (jobInterest) {
        if (jobInterest === status) {
          // Remove interest if clicking the same status
          await supabase
            .from('user_job_interests')
            .delete()
            .eq('user_id', user.id)
            .eq('job_id', jobId);
          
          setJobInterest(null);
          setNotes('');
        } else {
          // Update interest status
          await supabase
            .from('user_job_interests')
            .update({ 
              status, 
              updated_at: new Date().toISOString() 
            })
            .eq('user_id', user.id)
            .eq('job_id', jobId);
          
          setJobInterest(status);
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
        
        setJobInterest(status);
      }
      setMessage(`Job marked as ${status}`);
    } catch (error) {
      setMessage(`Error updating job interest: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!user || !jobInterest) {
      setMessage('Please mark your interest in this job first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('user_job_interests')
        .update({ 
          notes,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('job_id', jobId);

      if (error) throw error;
      setMessage('Notes saved successfully');
    } catch (error) {
      setMessage(`Error saving notes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading job details...</div>;
  if (!job) return <div className="text-center p-8">Job not found</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <Link href="/jobs" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
        &larr; Back to Job Listings
      </Link>
      
      <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
      <h2 className="text-xl text-gray-700 mb-4">{job.company}</h2>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span>{job.location || 'Location not specified'}</span>
        </div>
        
        {job.salary_range && (
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{job.salary_range}</span>
          </div>
        )}
        
        {job.contact_email && (
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <a href={`mailto:${job.contact_email}`} className="text-indigo-600 hover:text-indigo-800">
              {job.contact_email}
            </a>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {job.tags?.map((tag, index) => (
            <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-2">Job Description</h3>
        <div className="prose max-w-none">
          {job.job_description ? (
            <p className="whitespace-pre-line">{job.job_description}</p>
          ) : (
            <p className="text-gray-500 italic">No detailed description provided.</p>
          )}
        </div>
      </div>
      
      {message && (
        <div className={`mb-4 p-3 text-sm ${message.includes('Error') ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'} rounded`}>
          {message}
        </div>
      )}
      
      {user && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Mark Your Interest</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleJobInterest('saved')}
                className={`px-4 py-2 rounded ${
                  jobInterest === 'saved' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                disabled={loading}
              >
                {jobInterest === 'saved' ? 'Saved ✓' : 'Save for Later'}
              </button>
              <button
                onClick={() => handleJobInterest('interested')}
                className={`px-4 py-2 rounded ${
                  jobInterest === 'interested' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                disabled={loading}
              >
                {jobInterest === 'interested' ? 'Interested ✓' : 'Interested'}
              </button>
              <button
                onClick={() => handleJobInterest('applied')}
                className={`px-4 py-2 rounded ${
                  jobInterest === 'applied' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                disabled={loading}
              >
                {jobInterest === 'applied' ? 'Applied ✓' : 'Applied'}
              </button>
            </div>
          </div>
          
          {jobInterest && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Your Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows="4"
                placeholder="Add your notes about this job opportunity..."
              ></textarea>
              <button
                onClick={saveNotes}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                Save Notes
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}