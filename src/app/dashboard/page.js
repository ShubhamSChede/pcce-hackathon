'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Profile from '@/components/dashboard/profile';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Keep the navbar */}
      <Navbar/>
      
      {/* Main content area with padding for the navbar */}
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Replace all dashboard content with the Profile component */}
        <Profile />
      </div>
    </div>
  );
}