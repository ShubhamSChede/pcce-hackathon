'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaBuilding, FaMapMarkerAlt, FaEnvelope, FaMoneyBillWave, FaTag, FaCalendarAlt, FaBookmark, FaRegBookmark, FaThumbtack, FaPaperPlane } from 'react-icons/fa';

export default function JobDetail({ jobId }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobInterest, setJobInterest] = useState(null);
  const [interestStatus, setInterestStatus] = useState('saved'); // Default status
  const [notes, setNotes] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [userId, setUserId] = useState(null); // Add userId state

  // Get userId from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, []);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) {
        setError("No job ID provided");
        setLoading(false);
        return;
      }

      try {
        // Use userId from state instead of user object
        const headers = {};
        if (userId) {
          headers['x-user-id'] = userId;
        }
        
        console.log(`Fetching job with ID: ${jobId}`);
        
        // Make the API request
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch job details: ${response.status}. ${errorText}`);
        }

        const data = await response.json();
        console.log('Job details retrieved:', data);
        setJob(data);
        
        // If user is authenticated, check if they have already saved this job
        if (userId) {
          try {
            const interestResponse = await fetch(`/api/job-interests?jobId=${jobId}`, {
              method: 'GET',
              headers: {
                'x-user-id': userId
              }
            });
            
            if (interestResponse.ok) {
              const interestData = await interestResponse.json();
              if (interestData && !interestData.error) {
                console.log('Existing job interest:', interestData);
                setJobInterest(interestData);
                setInterestStatus(interestData.status || 'saved');
                setNotes(interestData.notes || '');
              }
            }
          } catch (interestError) {
            console.warn('Error checking existing job interest:', interestError);
            // Non-critical error, continue showing the job
          }
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, userId]); // Update dependency to use userId instead of user

  // Save job interest
  const saveJobInterest = async () => {
    if (!userId) {
      setSaveMessage('Please sign in to save this job');
      return;
    }
    
    setSaveLoading(true);
    setSaveMessage('');
    
    try {
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const payload = {
        status: interestStatus,
        notes: notes
      };
      
      // Determine if this is a create or update operation
      let url = '/api/job-interests';
      let method = 'POST';
      
      // If we have an existing job interest with an ID, use PUT to update
      if (jobInterest && jobInterest._id) {
        url = `/api/job-interests/${jobInterest._id}`;
        method = 'PUT';
        console.log(`Updating existing job interest with ID: ${jobInterest._id}`);
      } else {
        // For new job interests, add jobId to the payload
        payload.jobId = jobId;
        console.log('Creating new job interest');
      }
      
      console.log(`${method} request to ${url} with payload:`, payload);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Error response:', responseText);
        throw new Error(`Failed to ${method === 'POST' ? 'save' : 'update'} job interest: ${response.status}`);
      }
      
      // Try to parse the JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn('Could not parse response as JSON:', responseText);
        data = { 
          message: `Job ${method === 'POST' ? 'saved' : 'updated'} successfully`,
          jobInterest: { status: interestStatus, notes }
        };
      }
      
      console.log('Job interest response:', data);
      
      // Update local state
      setJobInterest(data.jobInterest || {
        _id: jobInterest?._id,
        status: interestStatus,
        notes,
        updatedAt: new Date().toISOString()
      });
      
      // Display success message
      setSaveMessage(method === 'POST' ? 'Job saved successfully!' : 'Job status updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000); // Clear message after 3 seconds
      setShowSaveForm(false); // Hide the form after successful save
      
    } catch (err) {
      console.error('Error saving job interest:', err);
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Toggle save form visibility
  const toggleSaveForm = () => {
    setShowSaveForm(!showSaveForm);
    if (!showSaveForm) {
      // Reset any previous error message when opening the form
      setSaveMessage('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/jobs" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-4">The job listing you're looking for doesn't exist or has been removed.</p>
          <Link href="/jobs" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Browse All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <Link href="/jobs" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
        &larr; Back to Job Listings
      </Link>
      
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        
        {userId && (
          <button 
            onClick={toggleSaveForm}
            className={`flex items-center px-3 py-2 rounded-lg ${
              jobInterest ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {jobInterest ? (
              <>
                <FaBookmark className="mr-2" />
                Saved
              </>
            ) : (
              <>
                <FaRegBookmark className="mr-2" />
                Save Job
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="flex items-center mb-4">
        <FaBuilding className="text-gray-500 mr-2" />
        <span className="text-xl text-gray-700">{job.company}</span>
      </div>
      
      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {saveMessage}
        </div>
      )}
      
      {/* Job Save Form */}
      {showSaveForm && userId && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-3">Save This Job</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Interest Level
            </label>
            <div className="flex flex-wrap gap-2">
              <button 
                type="button"
                onClick={() => setInterestStatus('saved')}
                className={`px-3 py-1 rounded-full text-sm flex items-center ${
                  interestStatus === 'saved' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <FaBookmark className="mr-1" size={12} /> 
                Saved
              </button>
              <button 
                type="button"
                onClick={() => setInterestStatus('interested')}
                className={`px-3 py-1 rounded-full text-sm flex items-center ${
                  interestStatus === 'interested' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <FaThumbtack className="mr-1" size={12} /> 
                Interested
              </button>
              <button 
                type="button"
                onClick={() => setInterestStatus('applied')}
                className={`px-3 py-1 rounded-full text-sm flex items-center ${
                  interestStatus === 'applied' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <FaPaperPlane className="mr-1" size={12} /> 
                Applied
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows="3"
              placeholder="Add any notes about this job, like application details or reminders..."
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowSaveForm(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveJobInterest}
              disabled={saveLoading}
              className="px-4 py-2 text-sm rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {saveLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {job.location && (
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-gray-500 mr-2" />
            <span>{job.location}</span>
          </div>
        )}
        
        {job.salary_range && (
          <div className="flex items-center">
            <FaMoneyBillWave className="text-gray-500 mr-2" />
            <span>{job.salary_range}</span>
          </div>
        )}
        
        {job.contact_email && (
          <div className="flex items-center">
            <FaEnvelope className="text-gray-500 mr-2" />
            <a href={`mailto:${job.contact_email}`} className="text-indigo-600 hover:text-indigo-800">
              {job.contact_email}
            </a>
          </div>
        )}
        
        {job.createdAt && (
          <div className="flex items-center">
            <FaCalendarAlt className="text-gray-500 mr-2" />
            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      {job.tags && job.tags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <FaTag className="mr-2 text-gray-500" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {job.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-xl font-medium mb-4">Job Description</h3>
        <div className="prose max-w-none">
          {job.job_description ? (
            <p className="whitespace-pre-line">{job.job_description}</p>
          ) : (
            <p className="text-gray-500 italic">No detailed description provided.</p>
          )}
        </div>
      </div>
      
      {/* Show job interest status if saved */}
      {jobInterest && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <h3 className="text-lg font-medium mb-2 text-indigo-700">Your Status</h3>
          <div className="flex items-center mb-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              jobInterest.status === 'saved' ? 'bg-indigo-100 text-indigo-800' : 
              jobInterest.status === 'interested' ? 'bg-green-100 text-green-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {jobInterest.status === 'saved' ? 'Saved' : 
               jobInterest.status === 'interested' ? 'Interested' : 
               'Applied'}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              {jobInterest.updatedAt ? `Updated: ${new Date(jobInterest.updatedAt).toLocaleDateString()}` : ''}
            </span>
          </div>
          
          {jobInterest.notes && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-700">Your Notes:</h4>
              <p className="text-sm text-gray-600 bg-white p-2 rounded mt-1">{jobInterest.notes}</p>
            </div>
          )}
          
          <button 
            onClick={toggleSaveForm}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Edit Status
          </button>
        </div>
      )}
      
      <div className="mt-8 flex justify-between items-center">
        <Link href="/jobs" className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
          Back to Jobs
        </Link>
        
        {job.contact_email && (
          <a 
            href={`mailto:${job.contact_email}?subject=Application for ${job.title} Position`} 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Apply Now
          </a>
        )}
      </div>
      
      {!userId && (
        <div className="mt-8 bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-sm text-gray-700">
            <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-800">
              Sign in
            </Link> to save this job or track your application status.
          </p>
        </div>
      )}
    </div>
  );
}