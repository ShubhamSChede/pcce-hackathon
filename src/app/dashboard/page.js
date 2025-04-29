'use client';

import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(); // Get both user and loading state from auth context
  const [userDetails, setUserDetails] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // Log authentication state on every render for debugging
  console.log("Auth state:", { user: user ? "Authenticated" : "Not authenticated", authLoading });

  useEffect(() => {
    // Wait until auth is fully loaded before proceeding
    if (authLoading) {
      console.log("Auth is still loading, waiting...");
      return;
    }
    
    // If we have no user after auth has loaded, we can stop loading but don't redirect
    if (!user) {
      console.log("Auth finished loading but no user found");
      setLoading(false);
      return;
    }
    
    console.log("Auth loaded successfully with user:", user.id);

    const fetchData = async () => {
      try {
        console.log("Fetching data for user:", user.id);
        
        // First verify the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Session error. Please try logging in again.");
          return;
        }
        
        // We already have user from useAuth(), so don't redirect if session is null
        // This handles cases where session might be transitioning or temporarily unavailable
        // but we still have user context from AuthContext
        
        console.log("Active session status:", session ? "Valid" : "Missing", "User ID:", user.id);
        
        // Fetch user details
        const { data: details, error: detailsError } = await supabase
          .from('user_details')
          .select('skills, interests, qualifications')
          .eq('id', user.id)
          .single();

        if (detailsError) {
          console.error('Error fetching user details:', detailsError);
          
          // Not finding the record is acceptable for new users
          if (detailsError.code === 'PGRST116') {
            console.log('No user details found, this is normal for new users');
            setUserDetails({
              skills: [],
              interests: [],
              qualifications: []
            });
          }
        } else {
          console.log('User details fetched successfully:', details);
          setUserDetails(details);
        }
        
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile data:', profileError);
          
          // Create a profile if it doesn't exist
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, creating one...');
            
            // Create basic profile structure
            const newProfileData = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Insert the new profile - with more detailed error logging
            console.log('Attempting to insert profile with data:', newProfileData);
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert(newProfileData) // Single object without array brackets may work better with some Supabase versions
              .select();
              
            console.log('Insert result:', newProfile ? 'Success' : 'Failed', createError ? `Error: ${createError.message}` : '');
              
            if (createError) {
              console.error('Error creating profile:', createError);
              
              // Still show some basic profile info even if creation fails
              setProfileData(newProfileData);
            } else {
              console.log('Profile created successfully:', newProfile);
              setProfileData(newProfile[0]);
            }
          } else {
            // Use basic profile data if there's an error other than "not found"
            setProfileData({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || 'User',
              created_at: new Date().toISOString()
            });
          }
        } else {
          console.log('Profile data fetched successfully:', profile);
          setProfileData(profile);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, supabase, router]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError("Failed to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!user) {
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
    <div className="container mx-auto px-4 py-8">
      <Navbar user={user} />
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Debug Information Panel - REMOVE IN PRODUCTION */}
      <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Debug Information</h3>
          <button 
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
            onClick={async () => {
              // Attempt to refresh the auth session
              const { data, error } = await supabase.auth.refreshSession();
              console.log("Session refresh:", data, error);
              setDebugInfo(prev => ({ 
                ...prev, 
                refreshAttempt: new Date().toISOString(),
                refreshResult: error ? `Error: ${error.message}` : 'Success'
              }));
            }}
          >
            Refresh Session
          </button>
        </div>
        <div className="mt-2 text-xs">
          <div><strong>Auth State:</strong> {user ? 'Authenticated' : 'Not authenticated'}</div>
          <div><strong>Auth Loading:</strong> {authLoading ? 'Yes' : 'No'}</div>
          <div><strong>User ID:</strong> {user?.id || 'None'}</div>
          <div><strong>Component Loading:</strong> {loading ? 'Yes' : 'No'}</div>
          <div><strong>Profile Data:</strong> {profileData ? 'Loaded' : 'Not loaded'}</div>
          <div><strong>Profile ID Match:</strong> {profileData?.id === user?.id ? 'Yes' : 'No'}</div>
          <div><strong>Last Refresh:</strong> {debugInfo.refreshAttempt || 'Never'}</div>
          <div><strong>Refresh Result:</strong> {debugInfo.refreshResult || 'N/A'}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Profile</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
      
      {/* Profile Card */}
      {profileData && (
        <div className="p-6 bg-white rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="flex items-start gap-6">
            {profileData.avatar_url && (
              <img 
                src={profileData.avatar_url} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-lg font-medium">{profileData.full_name || 'Name not set'}</p>
              <p className="text-gray-600">{profileData.email || user?.email || 'Email not available'}</p>
              {profileData.website && (
                <p className="text-blue-600 hover:underline">
                  <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                    {profileData.website}
                  </a>
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Member since {new Date(profileData.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Skills, Qualifications, Interests */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Career Profile</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skills */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {userDetails?.skills?.length > 0 ? (
                userDetails.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 italic">No skills added yet</p>
              )}
            </div>
          </div>
          
          {/* Qualifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Qualifications</h3>
            {userDetails?.qualifications?.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                {userDetails.qualifications.map((qual, index) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No qualifications added yet</p>
            )}
          </div>
          
          {/* Career Interests */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Career Interests</h3>
            {userDetails?.interests?.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                {userDetails.interests.map((interest, index) => (
                  <li key={index}>{interest}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No career interests added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}