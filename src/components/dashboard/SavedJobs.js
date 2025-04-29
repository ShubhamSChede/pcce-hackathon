'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaMoneyBillWave, 
  FaBookmark, 
  FaThumbtack, 
  FaPaperPlane, 
  FaTrash,
  FaEye,
  FaFilter,
  FaSortAmountDown
} from 'react-icons/fa';

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Get userId from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, []);

  // Fetch saved jobs when userId becomes available
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!userId) {
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/job-interests', {
          method: 'GET',
          headers: {
            'x-user-id': userId
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch saved jobs: ${response.status}`);
        }

        const data = await response.json();
        console.log('Saved jobs retrieved:', data);
        setSavedJobs(data);
      } catch (err) {
        console.error('Error fetching saved jobs:', err);
        setError(err.message || 'Failed to load saved jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, [userId]);

  // Handle status change for a job
  const handleStatusChange = async (jobInterestId, newStatus) => {
    if (!userId || !jobInterestId) return;
    
    try {
      const response = await fetch(`/api/job-interests/${jobInterestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to update job status: ${response.status}`);
      }

      // Update local state
      setSavedJobs(savedJobs.map(job => 
        job._id === jobInterestId 
          ? { ...job, status: newStatus, updatedAt: new Date().toISOString() } 
          : job
      ));

      setStatusMessage('Job status updated');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Error updating job status:', err);
      setError(`Failed to update status: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Confirm deletion dialog
  const confirmDelete = (jobInterestId) => {
    setDeleteConfirmation(jobInterestId);
  };

  // Handle job deletion
  const handleDelete = async (jobInterestId) => {
    if (!userId || !jobInterestId) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/job-interests/${jobInterestId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.status}`);
      }

      // Remove from local state
      setSavedJobs(savedJobs.filter(job => job._id !== jobInterestId));
      setStatusMessage('Job removed from saved list');
      
      // Clear confirmation modal
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting saved job:', err);
      setError(`Failed to delete job: ${err.message}`);
    } finally {
      setDeleteLoading(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Filter jobs by status
  const filteredJobs = savedJobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    } else if (sort === 'oldest') {
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    }
    // Add more sorting options if needed
    return 0;
  });

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'saved':
        return 'bg-indigo-100 text-indigo-800';
      case 'interested':
        return 'bg-green-100 text-green-800';
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'saved':
        return <FaBookmark className="mr-1" size={12} />;
      case 'interested':
        return <FaThumbtack className="mr-1" size={12} />;
      case 'applied':
        return <FaPaperPlane className="mr-1" size={12} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && savedJobs.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center p-8">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please sign in to view your saved jobs.</p>
          <Link href="/login" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center p-8">
          <h1 className="text-xl font-bold text-gray-800 mb-4">No Saved Jobs</h1>
          <p className="text-gray-600 mb-4">You haven't saved any jobs yet.</p>
          <Link href="/jobs" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Your Saved Jobs</h1>
      
      {statusMessage && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-green-100 text-green-700">
          {statusMessage}
        </div>
      )}
      
      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <FaFilter className="text-gray-500" />
          <span className="text-sm font-medium">Filter:</span>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded p-1"
          >
            <option value="all">All Saved Jobs</option>
            <option value="saved">Saved</option>
            <option value="interested">Interested</option>
            <option value="applied">Applied</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <FaSortAmountDown className="text-gray-500" />
          <span className="text-sm font-medium">Sort:</span>
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-gray-300 rounded p-1"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
      
      {/* Jobs List */}
      <div className="space-y-4">
        {sortedJobs.map((savedJob) => (
          <div key={savedJob._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {savedJob.job?.title || "Job title unavailable"}
                </h2>
                <div className="flex items-center text-gray-700 mb-2">
                  <FaBuilding className="text-gray-500 mr-2" />
                  <span>{savedJob.job?.company || "Company unavailable"}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm flex items-center ${getStatusBadgeClass(savedJob.status)}`}>
                  {getStatusIcon(savedJob.status)}
                  {savedJob.status.charAt(0).toUpperCase() + savedJob.status.slice(1)}
                </span>
                
                <div className="relative inline-block">
                  <button 
                    onClick={() => confirmDelete(savedJob._id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Delete saved job"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 mb-3">
              {savedJob.job?.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <FaMapMarkerAlt className="text-gray-500 mr-1" />
                  <span>{savedJob.job.location}</span>
                </div>
              )}
              
              {savedJob.job?.salary_range && (
                <div className="flex items-center text-sm text-gray-600">
                  <FaMoneyBillWave className="text-gray-500 mr-1" />
                  <span>{savedJob.job.salary_range}</span>
                </div>
              )}
            </div>
            
            {savedJob.notes && (
              <div className="mt-2 bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Your Notes:</span> {savedJob.notes}
                </p>
              </div>
            )}
            
            <div className="mt-3 flex flex-wrap items-center justify-between">
              <div className="flex space-x-1 mb-2 sm:mb-0">
                <button
                  onClick={() => handleStatusChange(savedJob._id, 'saved')}
                  className={`px-2 py-1 text-xs rounded ${
                    savedJob.status === 'saved' 
                      ? 'bg-indigo-200 text-indigo-800 font-medium' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Saved
                </button>
                <button
                  onClick={() => handleStatusChange(savedJob._id, 'interested')}
                  className={`px-2 py-1 text-xs rounded ${
                    savedJob.status === 'interested' 
                      ? 'bg-green-200 text-green-800 font-medium' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Interested
                </button>
                <button
                  onClick={() => handleStatusChange(savedJob._id, 'applied')}
                  className={`px-2 py-1 text-xs rounded ${
                    savedJob.status === 'applied' 
                      ? 'bg-blue-200 text-blue-800 font-medium' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Applied
                </button>
              </div>
              
              <Link 
                href={`/jobs/${savedJob.job?._id}`} 
                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
              >
                <FaEye className="mr-1" size={14} />
                View Job
              </Link>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              Saved: {new Date(savedJob.createdAt).toLocaleDateString()}
              {savedJob.updatedAt !== savedJob.createdAt && 
                ` • Updated: ${new Date(savedJob.updatedAt).toLocaleDateString()}`}
            </div>
          </div>
        ))}
      </div>
      
      {/* Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Remove Saved Job</h3>
            <p className="mb-6">Are you sure you want to remove this job from your saved list?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmation)}
                className="px-4 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}