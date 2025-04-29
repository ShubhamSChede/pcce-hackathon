'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSuitcase, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaClock } from 'react-icons/fa';

export default function JobListings({ userId, interests = [] }) {
  const [jobs, setJobs] = useState([]);  // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    location: '',
    type: 'all'  // all, fulltime, parttime, contract
  });
  const router = useRouter();

  // Fetch jobs when component mounts
  useEffect(() => {
    fetchJobs();
  }, []);

  // Function to fetch jobs from the API
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user ID from props or localStorage
      const currentUserId = userId || (typeof window !== 'undefined' ? localStorage.getItem('user_id') : null);
      
      // Build request headers
      const headers = {};
      if (currentUserId) {
        headers['x-user-id'] = currentUserId;
      }
      
      console.log('Fetching jobs with headers:', headers);
      
      // Make API request
      const response = await fetch('/api/jobs', {
        method: 'GET',
        headers
      });
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      if (!response.ok) {
        throw new Error(`Error fetching jobs: ${response.status} ${response.statusText}. ${responseText}`);
      }
      
      // Parse the JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing jobs response:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      console.log('Parsed jobs data:', data);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        // Handle cases where API returns an object with a jobs property or other formats
        if (data && data.jobs && Array.isArray(data.jobs)) {
          data = data.jobs;
        } else if (data && typeof data === 'object') {
          // Try to convert object to array
          data = Object.values(data);
        } else {
          // If all conversion attempts fail, set to empty array
          console.warn('API did not return an array of jobs, using empty array instead');
          data = [];
        }
      }
      
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to fetch job listings');
      setJobs([]); // Set jobs to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on search criteria - with safety check
  const filteredJobs = Array.isArray(jobs) ? jobs.filter(job => {
    // Skip filtering if job is invalid 
    if (!job) return false;
    
    // Filter by role/title
    if (filters.role && job.title && !job.title.toLowerCase().includes(filters.role.toLowerCase())) {
      return false;
    }
    
    // Filter by location
    if (filters.location && job.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    // Filter by job type
    if (filters.type !== 'all' && job.type !== filters.type) {
      return false;
    }
    
    return true;
  }) : [];

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      role: '',
      location: '',
      type: 'all'
    });
  };

  // Handle job selection/view details
  const viewJobDetails = (jobId) => {
    router.push(`/jobs/${jobId}`);
  };

  // Get recommended jobs based on user interests - with safety check
  const getRecommendedJobs = () => {
    if (!interests || interests.length === 0 || !Array.isArray(jobs)) return [];
    
    return jobs.filter(job => {
      if (!job) return false;
      
      return interests.some(interest => 
        (job.title && job.title.toLowerCase().includes(interest.toLowerCase())) || 
        (job.description && job.description.toLowerCase().includes(interest.toLowerCase())) ||
        (job.tags && Array.isArray(job.tags) && job.tags.some(tag => 
          interests.some(interest => tag.toLowerCase().includes(interest.toLowerCase()))
        ))
      );
    });
  };
  
  const recommendedJobs = getRecommendedJobs();

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Debug section to help diagnose issues */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 mb-4 rounded text-sm">
          <p className="font-semibold">Debug Info:</p>
          <p>Jobs array type: {typeof jobs}</p>
          <p>Is array: {Array.isArray(jobs) ? 'Yes' : 'No'}</p>
          <p>Jobs count: {Array.isArray(jobs) ? jobs.length : 'N/A'}</p>
          <p>User ID: {userId || 'Not provided'}</p>
          <p>Interests: {interests.length > 0 ? interests.join(', ') : 'None'}</p>
          <button 
            onClick={() => console.log('Current jobs state:', jobs)}
            className="bg-yellow-200 px-2 py-1 rounded mt-1"
          >
            Log Jobs to Console
          </button>
        </div>
      )}
      
      {/* Filters section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Find Your Perfect Job</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role / Title</label>
            <input
              type="text"
              id="role"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              placeholder="e.g. Software Developer"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="e.g. New York"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="fulltime">Full Time</option>
              <option value="parttime">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="mr-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Reset Filters
          </button>
          
          <button
            onClick={fetchJobs}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            Refresh Jobs
          </button>
        </div>
      </div>
      
      {/* Recommended jobs section - only show if there are recommendations */}
      {recommendedJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedJobs.slice(0, 3).map(job => (
              <div 
                key={job._id || job.id}
                className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => viewJobDetails(job._id || job.id)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-indigo-800">{job.title}</h3>
                  {job.featured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Featured</span>
                  )}
                </div>
                
                <div className="mt-2 flex items-center text-gray-600">
                  <FaBuilding className="mr-2" />
                  <span>{job.company}</span>
                </div>
                
                <div className="mt-2 flex items-center text-gray-600">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{job.location}</span>
                </div>
                
                <div className="mt-2 flex items-center text-gray-600">
                  <FaMoneyBillWave className="mr-2" />
                  <span>{job.salary || 'Competitive'}</span>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${job.type === 'fulltime' ? 'bg-green-100 text-green-800' : job.type === 'parttime' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {job.type === 'fulltime' ? 'Full Time' : job.type === 'parttime' ? 'Part Time' : job.type}
                  </span>
                  
                  <span className="text-xs text-gray-500">Added {new Date(job.postedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-right">
            <button
              onClick={() => document.getElementById('all-jobs').scrollIntoView({ behavior: 'smooth' })}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              View all jobs →
            </button>
          </div>
        </div>
      )}
      
      {/* All jobs section */}
      <div id="all-jobs">
        <h2 className="text-xl font-bold text-gray-800 mb-4">All Available Positions</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <p>{error}</p>
            <button 
              onClick={fetchJobs}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-3 rounded"
            >
              Try Again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or check back later for new opportunities.</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <div 
                key={job._id || job.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => viewJobDetails(job._id || job.id)}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                    <div className="mt-1 text-gray-600 flex items-center">
                      <FaBuilding className="mr-1" />
                      <span className="mr-3">{job.company}</span>
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 md:mt-0 flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full mr-2 ${job.type === 'fulltime' ? 'bg-green-100 text-green-800' : job.type === 'parttime' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {job.type === 'fulltime' ? 'Full Time' : job.type === 'parttime' ? 'Part Time' : job.type}
                    </span>
                    
                    {job.featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="mt-2 text-gray-600 line-clamp-2">{job.description}</p>
                
                <div className="mt-3 flex justify-between items-center">
                  <div className="text-gray-700">
                    <FaMoneyBillWave className="inline mr-1" />
                    <span>{job.salary || 'Competitive'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <FaClock className="mr-1" />
                    <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {job.tags && job.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {job.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}