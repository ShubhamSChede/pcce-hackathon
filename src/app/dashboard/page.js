'use client';

import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import LogoutButton from '@/components/auth/LogoutButton';

export default function DashboardPage() {
  const { user, getUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profileData = await getUserProfile();
        setProfile(profileData);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, getUserProfile]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <LogoutButton />
        </div>
        
        {profile ? (
          <div>
            <p className="mb-4">
              <span className="font-semibold">Welcome,</span> {profile.full_name}
            </p>
            <p className="mb-4">
              <span className="font-semibold">Email:</span> {profile.email}
            </p>
          </div>
        ) : (
          <p>No profile data available</p>
        )}
      </div>
    </div>
  );
}