'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Profile from '@/components/dashboard/profile';
import CareerDetails from '@/components/dashboard/careerdetails';
import MeetingScheduler from '@/components/dashboard/meetingscheduler';
import SavedJobs from '@/components/dashboard/SavedJobs';

export default function DashboardPage() {
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check subscription status on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      // Get user ID from localStorage
      const storedUserId = localStorage.getItem('user_id');
      
      if (storedUserId) {
        setUserId(storedUserId);
        
        // Check subscription status
        const subscriptionStatus = localStorage.getItem(`subscription_${storedUserId}`);
        if (subscriptionStatus) {
          try {
            const isUserSubscribed = JSON.parse(subscriptionStatus);
            setIsSubscribed(!!isUserSubscribed); // Convert to boolean
          } catch (e) {
            console.error('Error parsing subscription data from localStorage:', e);
            setIsSubscribed(false);
          }
        }
      }
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Keep the navbar */}
      <Navbar/>
      
      {/* Main content area with proper spacing for the sidebar */}
      <div className="flex-1 transition-all duration-300 md:ml-64">
        {/* Add proper padding to avoid content being hidden under navbar on mobile */}
        <div className="pt-16 md:pt-6 px-4 md:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center md:text-left">User Dashboard</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile card in the left column */}
            <div className="lg:col-span-2">
              <Profile />
              <SavedJobs />
            </div>
            
            {/* Career details in the remaining space */}
            <div className="lg:col-span-2">
              <CareerDetails />
            </div>
          </div>
          
          {/* Meeting Scheduler - only shown for subscribers */}
          {!isLoading && isSubscribed && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Schedule Mentoring Sessions</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      As a premium subscriber, you can schedule one-on-one mentoring sessions with industry experts.
                    </p>
                  </div>
                </div>
              </div>
              <MeetingScheduler />
            </div>
          )}
          
          {/* Show upgrade prompt for non-subscribers */}
          {!isLoading && !isSubscribed && (
            <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Unlock Premium Features</h2>
              <p className="text-gray-600 mb-4">
                Upgrade to our premium subscription to access mentoring sessions with industry experts, 
                personalized career guidance, and more advanced tools.
              </p>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">Mentor Sessions</h3>
                  <p className="text-sm text-gray-500">Schedule 1:1 calls with professionals in your field</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <button 
                onClick={() => {
                  // Update CareerDetails with subscription checked
                  if (typeof window !== 'undefined' && userId) {
                    localStorage.setItem(`subscription_${userId}`, JSON.stringify(true));
                    setIsSubscribed(true);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}