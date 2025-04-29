'use client';
import { useParams } from 'next/navigation';
import JobDetail from '@/components/JobDetail';

export default function JobDetailPage() {
  const params = useParams();
  return <JobDetail jobId={params.id} />;
}