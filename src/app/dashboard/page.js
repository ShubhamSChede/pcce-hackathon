'use client';

import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Profile from '@/components/dashboard/profile';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Simple loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user && !authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Please log in to view this page.
          <button 
            className="ml-4 bg-blue-500 text-white px-3 py-1 rounded text-sm"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Keep the navbar */}
      <Navbar user={user} />
      
      {/* Main content area with padding for the navbar */}
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Replace all dashboard content with the Profile component */}
        <Profile />
      </div>
    </div>
  );
}