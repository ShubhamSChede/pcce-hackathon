'use client';

import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import LogoutButton from '@/components/auth/LogoutButton';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DashboardPage() {
  const { user, getUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [recommendedCareers, setRecommendedCareers] = useState([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        // Get profile
        const profileData = await getUserProfile();
        setProfile(profileData);
        
        // Fetch user details
        const { data: details } = await supabase
          .from('user_details')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setUserDetails(details);
        
        // Fetch user's job interests
        const { data: jobInterests } = await supabase
          .from('user_job_interests')
          .select(`
            *,
            job_opportunities:job_id (*)
          `)
          .eq('user_id', user.id);
        
        if (jobInterests) {
          // Separate saved and applied jobs
          const saved = jobInterests.filter(item => item.status === 'saved');
          const applied = jobInterests.filter(item => item.status === 'applied');
          
          setSavedJobs(saved);
          setAppliedJobs(applied);
        }
        
        // Fetch recommended career paths based on user skills
        if (details && details.skills && details.skills.length > 0) {
          const { data: careers } = await supabase
            .from('career_paths')
            .select('*');
            
          if (careers) {
            // Find careers that match user skills
            const userSkills = details.skills.map(skill => skill.toLowerCase());
            
            const matchedCareers = careers.map(career => {
              const requiredSkills = career.required_skills?.map(skill => skill.toLowerCase()) || [];
              
              // Count matching skills
              const matchingSkills = requiredSkills.filter(skill => 
                userSkills.includes(skill)
              );
              
              const matchPercentage = requiredSkills.length > 0 
                ? Math.round((matchingSkills.length / requiredSkills.length) * 100) 
                : 0;
                
              return { ...career, matchPercentage };
            });
            
            // Sort by match percentage and take top 3
            const recommended = matchedCareers
              .sort((a, b) => b.matchPercentage - a.matchPercentage)
              .slice(0, 3);
              
            setRecommendedCareers(recommended);
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user, getUserProfile, supabase]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Summary */}
        <div className="lg:col-span-3 p-6 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Profile Summary</h2>
            <Link href="/profile" className="text-indigo-600 hover:text-indigo-800">
              Edit Profile
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {userDetails?.skills?.length > 0 ? (
                  userDetails.skills.map((skill, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic">No skills added yet</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Qualifications</h3>
              <div className="mt-2">
                {userDetails?.qualifications?.length > 0 ? (
                  <ul className="text-sm text-gray-600">
                    {userDetails.qualifications.map((qual, index) => (
                      <li key={index}>{qual}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm italic">No qualifications added yet</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Career Interests</h3>
              <div className="mt-2">
                {userDetails?.interests?.length > 0 ? (
                  <ul className="text-sm text-gray-600">
                    {userDetails.interests.map((interest, index) => (
                      <li key={index}>{interest}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm italic">No interests added yet</p>
                )}
              </div>
            </div>
          </div>
          
          {(!userDetails || !userDetails.skills || userDetails.skills.length === 0) && (
            <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
              <p>
                Complete your profile to get personalized career recommendations!{' '}
                <Link href="/profile" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Add your skills and qualifications
                </Link>
              </p>
            </div>
          )}
        </div>
        
        {/* Recommended Career Paths */}
        <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recommended Career Paths</h2>
            <Link href="/careers" className="text-indigo-600 hover:text-indigo-800">
              View All
            </Link>
          </div>
          
          {recommendedCareers.length > 0 ? (
            <div className="space-y-4">
              {recommendedCareers.map(career => (
                <div key={career.id} className="border rounded-lg p-3">
                  <h3 className="text-lg font-medium">{career.title}</h3>
                  
                  <div className="mt-2 mb-3">
                    <div className="flex items-center">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-2 rounded-full ${
                            career.matchPercentage > 70 ? 'bg-green-500' : 
                            career.matchPercentage > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${career.matchPercentage}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium">{career.matchPercentage}% match</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{career.description}</p>
                  
                  <Link 
                    href={`/careers/${career.id}`} 
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {userDetails?.skills?.length > 0 
                  ? "No matching career paths found" 
                  : "Add skills to get career recommendations"}
              </p>
            </div>
          )}
        </div>
        
        {/* Job Applications */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Job Applications</h2>
            <Link href="/jobs" className="text-indigo-600 hover:text-indigo-800">
              Find Jobs
            </Link>
          </div>
          
          {appliedJobs.length > 0 ? (
            <div className="space-y-3">
              {appliedJobs.slice(0, 3).map(item => (
                <div key={item.id} className="border-b pb-3 last:border-b-0">
                  <h3 className="font-medium">{item.job_opportunities.title}</h3>
                  <p className="text-gray-600 text-sm">{item.job_opportunities.company}</p>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Applied
                    </span>
                  </div>
                </div>
              ))}
              
              {appliedJobs.length > 3 && (
                <Link 
                  href="/profile/jobs" 
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View all {appliedJobs.length} applications
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No job applications yet</p>
            </div>
          )}
        </div>
        
        {/* Saved Jobs */}
        <div className="p-6 bg-white rounded-lg shadow lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Saved Jobs</h2>
            <Link href="/profile/jobs" className="text-indigo-600 hover:text-indigo-800">
              View All
            </Link>
          </div>
          
          {savedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedJobs.slice(0, 4).map(item => (
                <div key={item.id} className="border rounded-lg p-3">
                  <h3 className="font-medium">{item.job_opportunities.title}</h3>
                  <p className="text-gray-600 text-sm">{item.job_opportunities.company}</p>
                  <p className="text-gray-500 text-xs mt-1">{item.job_opportunities.location}</p>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <span className="inline-block px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                      Saved
                    </span>
                    <Link 
                      href={`/jobs/${item.job_id}`} 
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No saved jobs yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
