'use client';

import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import JobDetail from '@/components/job/JobDetail';

export default function JobDetailPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        <JobDetail jobId={id} />
      </div>
    </div>
  );
}