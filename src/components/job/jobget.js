'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSuitcase, FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaClock, FaSpinner, FaRobot } from 'react-icons/fa';

export default function JobListings({ userId, interests = [] }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    location: '',
    type: 'all'
  });
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [userProfile, setUserProfile] = useState({
    skills: [],
    qualifications: [],
    interests: []
  });
  const router = useRouter();

  // Fetch jobs when component mounts
  useEffect(() => {
    fetchJobs();
    loadUserProfile();
  }, []);

  // Load user profile from localStorage
  const loadUserProfile = () => {
    if (typeof window !== 'undefined') {
      const storedUserId = userId || localStorage.getItem('user_id');
      
      if (storedUserId) {
        try {
          // Try to get user profile data from localStorage
          const storedSkills = localStorage.getItem(`skills_${storedUserId}`);
          const storedQualifications = localStorage.getItem(`qualifications_${storedUserId}`);
          const storedInterests = localStorage.getItem(`interests_${storedUserId}`);
          
          const profile = {
            skills: storedSkills ? JSON.parse(storedSkills) : [],
            qualifications: storedQualifications ? JSON.parse(storedQualifications) : [],
            interests: storedInterests ? JSON.parse(storedInterests) : interests || []
          };
          
          setUserProfile(profile);
          console.log('Loaded user profile from localStorage:', profile);
        } catch (err) {
          console.error('Error loading user profile from localStorage:', err);
        }
      }
    }
  };

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
      
      // Make API request
      const response = await fetch('/api/jobs', {
        method: 'GET',
        headers
      });
      
      // Get the response text
      const responseText = await response.text();
      
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
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        if (data && data.jobs && Array.isArray(data.jobs)) {
          data = data.jobs;
        } else if (data && typeof data === 'object') {
          data = Object.values(data);
        } else {
          console.warn('API did not return an array of jobs, using empty array instead');
          data = [];
        }
      }
      
      setJobs(data);
      
      // After loading jobs, get AI recommendations if we have profile data
      const hasProfileData = userProfile.skills.length > 0 || 
                            userProfile.qualifications.length > 0 || 
                            userProfile.interests.length > 0;
                            
      if (hasProfileData && data.length > 0) {
        getAiRecommendations(data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to fetch job listings');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Get AI-powered job recommendations using Gemini API
  const getAiRecommendations = async (jobsData) => {
    setAiLoading(true);
    setAiError(null);
    
    try {
      // Check if we have profile data and jobs to analyze
      if (
        (userProfile.skills.length === 0 && 
         userProfile.qualifications.length === 0 && 
         userProfile.interests.length === 0) || 
        jobsData.length === 0
      ) {
        console.log('Not enough data for AI recommendations');
        setAiLoading(false);
        return;
      }
      
      console.log('Getting AI recommendations based on profile:', userProfile);
      
      // Prepare job data to send to Gemini API
      // Limit to max 10 jobs to avoid token limits
      const jobsToAnalyze = jobsData.slice(0, 10).map(job => ({
        id: job._id || job.id,
        title: job.title,
        company: job.company,
        description: job.description?.substring(0, 300) || '', // Limit description length
        requirements: job.requirements?.substring(0, 300) || '',
        type: job.type,
        location: job.location,
        tags: job.tags || []
      }));
      
      // Call Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a career advisor and job matching expert. Based on the user's profile and available job listings, recommend the most suitable jobs for them.
              
              USER PROFILE:
              Skills: ${userProfile.skills.join(', ')}
              Qualifications: ${userProfile.qualifications.join(', ')}
              Interests: ${userProfile.interests.join(', ')}
              
              AVAILABLE JOBS (in JSON format):
              ${JSON.stringify(jobsToAnalyze, null, 2)}
              
              TASK:
              1. Analyze the user's profile and the available jobs
              2. Select the top 3 most suitable jobs for this user based on skills match, qualifications, and interests
              3. Explain why each job is a good match (keep explanations brief, max 2 sentences)
              4. Format your response as JSON with the following structure:
              {
                "recommendations": [
                  {
                    "jobId": "id of the job",
                    "matchScore": a number between 0 and 100 indicating match quality,
                    "matchReason": "Brief explanation of why this job matches the user's profile"
                  }
                ]
              }
              
              IMPORTANT: Return ONLY the JSON with no other text. Ensure the jobId is exactly as provided in the input.`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendations');
      }
      
      const data = await response.json();
      const recommendationText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!recommendationText) {
        throw new Error('Empty response from AI');
      }
      
      // Extract JSON from the response
      try {
        // Remove any markdown code block syntax if present
        const jsonText = recommendationText.replace(/```json|```/g, '').trim();
        const recommendationsData = JSON.parse(jsonText);
        
        if (!recommendationsData.recommendations || !Array.isArray(recommendationsData.recommendations)) {
          throw new Error('Invalid recommendations format');
        }
        
        // Match recommendations with job details
        const recommendedJobs = recommendationsData.recommendations.map(rec => {
          const job = jobsData.find(j => (j._id || j.id) === rec.jobId);
          return {
            ...job,
            aiMatchScore: rec.matchScore,
            aiMatchReason: rec.matchReason
          };
        }).filter(j => j); // Remove any undefined jobs (in case jobId wasn't found)
        
        setAiRecommendations(recommendedJobs);
        console.log('AI Recommendations:', recommendedJobs);
      } catch (parseError) {
        console.error('Error parsing AI recommendations:', parseError, recommendationText);
        throw new Error('Invalid AI response format');
      }
    } catch (err) {
      console.error('Error getting AI recommendations:', err);
      setAiError(err.message || 'Failed to get AI job recommendations');
    } finally {
      setAiLoading(false);
    }
  };

  // Filter jobs based on search criteria
  const filteredJobs = Array.isArray(jobs) ? jobs.filter(job => {
    if (!job) return false;
    
    if (filters.role && job.title && !job.title.toLowerCase().includes(filters.role.toLowerCase())) {
      return false;
    }
    
    if (filters.location && job.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
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
    if (!userProfile.interests || userProfile.interests.length === 0 || !Array.isArray(jobs)) return [];
    
    return jobs.filter(job => {
      if (!job) return false;
      
      return userProfile.interests.some(interest => 
        (job.title && job.title.toLowerCase().includes(interest.toLowerCase())) || 
        (job.description && job.description.toLowerCase().includes(interest.toLowerCase())) ||
        (job.tags && Array.isArray(job.tags) && job.tags.some(tag => 
          userProfile.interests.some(interest => tag.toLowerCase().includes(interest.toLowerCase()))
        ))
      );
    });
  };
  
  const recommendedJobs = getRecommendedJobs();

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Filters section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-950 mb-4">Find Your Perfect Job</h2>
        
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
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-950 focus:border-blue-950"
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
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-950 focus:border-blue-950"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-950 focus:border-blue-950"
            >
              <option value="all">All Types</option>
              <option value="fulltime">Full Time</option>
              <option value="parttime">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => getAiRecommendations(jobs)}
            disabled={aiLoading || loading}
            className="px-4 py-2 text-sm text-white bg-blue-900 hover:bg-blue-700 rounded flex items-center disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                AI is thinking...
              </>
            ) : (
              <>
                <FaRobot className="mr-2" />
                Get AI Recommendations
              </>
            )}
          </button>
          
          <div>
            <button
              onClick={resetFilters}
              className="mr-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Reset Filters
            </button>
            
            <button
              onClick={fetchJobs}
              className="px-4 py-2 text-sm text-white bg-blue-900 hover:bg-blue-700 rounded"
            >
              Refresh Jobs
            </button>
          </div>
        </div>
      </div>
      
      {/* AI Recommended jobs section */}
      {aiRecommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
            <FaRobot className="mr-2" />
            AI-Powered Job Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiRecommendations.map(job => (
              <div 
                key={job._id || job.id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => viewJobDetails(job._id || job.id)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-blue-950">{job.title}</h3>
                  <span className="bg-blue-100 text-blue-950 text-xs px-2 py-1 rounded-full">
                    {job.aiMatchScore}% Match
                  </span>
                </div>
                
                <div className="mt-2 flex items-center text-gray-900">
                  <FaBuilding className="mr-2" />
                  <span>{job.company}</span>
                </div>
                
                <div className="mt-2 flex items-center text-gray-90">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{job.location}</span>
                </div>
                
                <div className="mt-2 text-gray-700 bg-blue-50 rounded p-2 text-sm">
                  <p className="font-medium text-blue-950 mb-1">Why it&apos;s a good match:</p>
                  <p>{job.aiMatchReason}</p>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${job.type === 'fulltime' ? 'bg-green-100 text-green-950' : job.type === 'parttime' ? 'bg-blue-100 text-blue-950' : 'bg-blue-100 text-blue-950'}`}>
                    {job.type === 'fulltime' ? 'Full Time' : job.type === 'parttime' ? 'Part Time' : job.type}
                  </span>
                  
                  <span className="text-xs text-gray-950">Added {new Date(job.postedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* AI Error message */}
      {aiError && (
        <div className="bg-red-50 border border-red-200 text-red-950 rounded-lg p-4 mb-6">
          <p className="flex items-center">
            <FaRobot className="mr-2" />
            {aiError}
          </p>
          <button 
            onClick={() => getAiRecommendations(jobs)}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-950 font-medium py-1 px-3 rounded"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Interest-based recommendations section */}
      {recommendedJobs.length > 0 && aiRecommendations.length === 0 && (
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
                  <h3 className="text-lg font-semibold text-indigo-950">{job.title}</h3>
                  {job.featured && (
                    <span className="bg-yellow-100 text-yellow-950 text-xs px-2 py-1 rounded-full">Featured</span>
                  )}
                </div>
                
                <div className="mt-2 flex items-center text-gray-900">
                  <FaBuilding className="mr-2" />
                  <span>{job.company}</span>
                </div>
                
                <div className="mt-2 flex items-center text-gray-900">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{job.location}</span>
                </div>
                
                <div className="mt-2 flex items-center text-gray-900">
                  <FaMoneyBillWave className="mr-2" />
                  <span>{job.salary || 'Competitive'}</span>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${job.type === 'fulltime' ? 'bg-green-100 text-green-950' : job.type === 'parttime' ? 'bg-blue-100 text-blue-950' : 'bg-blue-100 text-blue-950'}`}>
                    {job.type === 'fulltime' ? 'Full Time' : job.type === 'parttime' ? 'Part Time' : job.type}
                  </span>
                  
                  <span className="text-xs text-gray-950">Added {new Date(job.postedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-right">
            <button
              onClick={() => document.getElementById('all-jobs').scrollIntoView({ behavior: 'smooth' })}
              className="text-indigo-900 hover:text-indigo-950 text-sm font-medium"
            >
              View all jobs →
            </button>
          </div>
        </div>
      )}
      
      {/* All jobs section */}
      <div id="all-jobs">
        <h2 className="text-xl font-bold text-gray-950 mb-4">All Available Positions</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-950"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-950 rounded-lg p-4">
            <p>{error}</p>
            <button 
              onClick={fetchJobs}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-950 font-medium py-1 px-3 rounded"
            >
              Try Again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-950 mb-2">No jobs found</h3>
            <p className="text-gray-900 mb-4">Try adjusting your filters or check back later for new opportunities.</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-700"
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
                    <h3 className="text-lg font-semibold text-gray-950">{job.title}</h3>
                    <div className="mt-1 text-gray-900 flex items-center">
                      <FaBuilding className="mr-1" />
                      <span className="mr-3">{job.company}</span>
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 md:mt-0 flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full mr-2 ${job.type === 'fulltime' ? 'bg-green-100 text-green-950' : job.type === 'parttime' ? 'bg-blue-100 text-blue-950' : 'bg-blue-100 text-blue-950'}`}>
                      {job.type === 'fulltime' ? 'Full Time' : job.type === 'parttime' ? 'Part Time' : job.type}
                    </span>
                    
                    {job.featured && (
                      <span className="bg-yellow-100 text-yellow-950 text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="mt-2 text-gray-900 line-clamp-2">{job.description}</p>
                
                <div className="mt-3 flex justify-between items-center">
                  <div className="text-gray-700">
                    <FaMoneyBillWave className="inline mr-1" />
                    <span>{job.salary || 'Competitive'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-950 text-sm">
                    <FaClock className="mr-1" />
                    <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {job.tags && job.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {job.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-950 text-xs px-2 py-1 rounded"
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