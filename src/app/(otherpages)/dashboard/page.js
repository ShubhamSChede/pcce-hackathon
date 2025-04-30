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
    <div className="min-h-screen bg-slate-50">
      <Navbar/>
      
      {/* Career Assessment Banner */}
      <div className=" text-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 mt-16">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Discover Your Ideal Career Path
              </h2>
              <p className="mt-1 text-indigo-100">Take our comprehensive career assessment test to find your perfect fit</p>
            </div>
            <button 
              onClick={() => router.push('/test')} 
              className="px-6 py-3 bg-white text-indigo-600 rounded-md font-semibold hover:bg-indigo-100 transition-colors shadow-md"
            >
              Take Assessment Test
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content area with proper spacing */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-8 pb-12 transition-all duration-300">
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your profile, career progress, and job opportunities</p>
          <div className="mt-4 h-1 w-20 bg-blue-600 rounded"></div>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile and Saved Jobs */}
          <div className="lg:col-span-1 space-y-8">
            {/* Profile Card */}
            <div className="transform transition-all hover:shadow-lg">
              <Profile />
            </div>
            
            {/* Saved Jobs */}
            <div className="transform transition-all hover:shadow-lg">
              <SavedJobs />
            </div>

            {/* Subscription Card - Only for non-subscribers */}
            {!isLoading && !isSubscribed && (
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg text-white overflow-hidden">
                <div className="px-6 py-6">
                  <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <h2 className="text-xl font-bold">Upgrade to Premium</h2>
                  </div>
                  <ul className="space-y-2 mb-5">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-blue-100">1:1 Mentoring Sessions</span>
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-blue-100">Career Path Analysis</span>
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-blue-100">Priority Job Listings</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => {
                      // Update subscription status
                      if (typeof window !== 'undefined' && userId) {
                        localStorage.setItem(`subscription_${userId}`, JSON.stringify(true));
                        setIsSubscribed(true);
                      }
                    }}
                    className="w-full bg-white hover:bg-blue-50 text-blue-800 font-medium py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Career Details and Meeting Scheduler */}
          <div className="lg:col-span-2 space-y-8">
            {/* Career Details */}
            <div className="transform transition-all hover:shadow-lg">
              <CareerDetails />
            </div>
            
            {/* Meeting Scheduler - only shown for subscribers */}
            {!isLoading && isSubscribed && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:shadow-lg">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-5">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h2 className="text-xl font-bold">Schedule Mentoring Sessions</h2>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">Book time with industry experts</p>
                </div>
                <div className="p-6">
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-800">
                          As a premium member, you can schedule 1:1 mentoring sessions with industry experts. Choose from available time slots below.
                        </p>
                      </div>
                    </div>
                  </div>
                  <MeetingScheduler />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}