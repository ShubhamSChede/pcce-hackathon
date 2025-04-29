// src/app/components/CareerPaths.jsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function CareerPaths() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [careers, setCareers] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch career paths
      const { data: careersData, error: careersError } = await supabase
        .from('career_paths')
        .select('*');

      if (careersError) {
        console.error('Error fetching careers:', careersError);
      } else {
        setCareers(careersData || []);
      }

      // Get user session and skills if logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        
        // Fetch user's skills
        const { data: userDetails } = await supabase
          .from('user_details')
          .select('skills')
          .eq('id', session.user.id)
          .single();
          
        if (userDetails && userDetails.skills) {
          setUserSkills(userDetails.skills);
        }
      }
      
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  // Calculate skill match percentage for each career path
  const getSkillMatchPercentage = (requiredSkills) => {
    if (!user || !userSkills.length || !requiredSkills || !requiredSkills.length) {
      return 0;
    }
    
    // Count matching skills
    const matchingSkills = requiredSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase() === skill.toLowerCase()
      )
    );
    
    return Math.round((matchingSkills.length / requiredSkills.length) * 100);
  };

  if (loading) return <div className="text-center p-8">Loading career paths...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <h2 className="text-2xl font-bold mb-6">Career Paths</h2>
      
      {user && userSkills.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p>
            Add your skills in your profile to see personalized career path matches!{' '}
            <Link href="/profile/details" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Update Profile
            </Link>
          </p>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        {careers.length > 0 ? (
          careers.map((career) => {
            const matchPercentage = getSkillMatchPercentage(career.required_skills);
            
            return (
              <div key={career.id} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold">{career.title}</h3>
                
                {user && userSkills.length > 0 && (
                  <div className="mt-2 mb-3">
                    <div className="flex items-center">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-2 rounded-full ${
                            matchPercentage > 70 ? 'bg-green-500' : 
                            matchPercentage > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${matchPercentage}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium">{matchPercentage}% match</span>
                    </div>
                  </div>
                )}
                
                <p className="text-gray-600 mb-3">{career.description}</p>
                
                {career.required_skills && career.required_skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Required Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {career.required_skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className={`text-xs px-2 py-1 rounded ${
                            userSkills.some(s => s.toLowerCase() === skill.toLowerCase())
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {career.related_jobs && career.related_jobs.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Related Job Titles:</h4>
                    <p className="text-gray-600 text-sm">{career.related_jobs.join(", ")}</p>
                  </div>
                )}
                
                <div className="mt-4">
                  <Link 
                    href={`/careers/${career.id}`} 
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View Career Path
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center p-8 bg-gray-50 rounded-lg">
            No career paths available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}