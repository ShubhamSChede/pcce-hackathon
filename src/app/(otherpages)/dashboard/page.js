'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Profile from '@/components/dashboard/profile';
import CareerDetails from '@/components/dashboard/careerdetails';

export default function DashboardPage() {
  const router = useRouter();

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
            <div className="lg:col-span-1">
              <Profile />
            </div>
            
            {/* Career details in the remaining space */}
            <div className="lg:col-span-2">
              <CareerDetails />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}