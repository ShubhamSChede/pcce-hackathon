// src/app/jobs/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import JobListings from '@/components/job/jobget';

export default function JobsPage() {
  const [userInterests, setUserInterests] = useState([]);
  
  // Fetch user interests from your API or localStorage
  useEffect(() => {
    const fetchUserInterests = async () => {
      try {
        // Get userId from localStorage only
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user_id');
          
          if (userId) {
            // Try to get cached interests
            const storedInterests = localStorage.getItem(`career_interests_${userId}`);
            if (storedInterests) {
              try {
                setUserInterests(JSON.parse(storedInterests));
              } catch (e) {
                console.error("Error parsing interests from localStorage:", e);
              }
            }
            
            // Then fetch fresh data from API
            try {
              const response = await fetch('/api/user-details', {
                method: 'GET',
                headers: {
                  'x-user-id': userId
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.interests && Array.isArray(data.interests)) {
                  setUserInterests(data.interests);
                  
                  // Cache the results
                  localStorage.setItem(`career_interests_${userId}`, JSON.stringify(data.interests));
                }
              }
            } catch (apiError) {
              console.error("API error fetching user interests:", apiError);
            }
          }
        }
      } catch (error) {
        console.error("Error in fetchUserInterests:", error);
      }
    };
    
    fetchUserInterests();
  }, []); // No dependencies, run once on mount
  
  // Get userId safely
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id');
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      
      <div className="container mx-auto px-4 py-8 pt-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Explore Job Opportunities</h1>
        
        {/* Pass down the userId and interests as props */}
        <JobListings 
          userId={getUserId()} 
          interests={userInterests}
        />
      </div>
    </div>
  );
}