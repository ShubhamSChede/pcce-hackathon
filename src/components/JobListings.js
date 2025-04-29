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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const jobsPerPage = 6; // Number of jobs to display per page

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      try {
        // First, get the total count of jobs for pagination
        const { count, error: countError } = await supabase
          .from('job_opportunities')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('Error fetching job count:', countError);
          return;
        }
        
        setTotalJobs(count || 0);
        setTotalPages(Math.ceil(count / jobsPerPage));
        
        // Calculate range for pagination
        const from = (currentPage - 1) * jobsPerPage;
        const to = from + jobsPerPage - 1;
        
        // Fetch paginated jobs
        const { data: jobsData, error: jobsError } = await supabase
          .from('job_opportunities')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

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
      } catch (error) {
        console.error('Error in fetchData:', error);
        setMessage('Error loading job listings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, currentPage]); // Add currentPage as a dependency

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keep your existing handleJobInterest function as is
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
      
      {/* Job count and pagination info */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {totalJobs === 0 ? 'No jobs found' : 
            `Showing ${Math.min((currentPage - 1) * jobsPerPage + 1, totalJobs)} - 
            ${Math.min(currentPage * jobsPerPage, totalJobs)} of ${totalJobs} jobs`}
        </p>
      </div>
      
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
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex shadow-sm rounded-md" aria-label="Pagination">
            {/* Previous page button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                currentPage === 1 
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Page numbers */}
            {[...Array(totalPages)].map((_, i) => {
              // Show first page, last page, current page, and pages around current
              const pageNumber = i + 1;
              
              // Logic for which page numbers to show
              const showPage = 
                pageNumber === 1 || // First page
                pageNumber === totalPages || // Last page
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1); // Around current
              
              // Show dots if there's a gap in page numbers
              if (!showPage) {
                // Show dots only once between gaps
                if (pageNumber === 2 || pageNumber === totalPages - 1) {
                  return (
                    <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700">
                      ...
                    </span>
                  );
                }
                return null;
              }
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border ${
                    currentPage === pageNumber
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            {/* Next page button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                currentPage === totalPages 
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}