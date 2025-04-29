// src/app/jobs/page.jsx
'use client';

import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import JobListings from '@/components/JobListings';

export default function JobsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <JobListings />
    </div>
  );
}