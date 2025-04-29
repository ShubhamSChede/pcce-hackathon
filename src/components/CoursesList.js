// src/app/components/CoursesList.jsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function CoursesList() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title');

      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        setCourses(data || []);
        
        // Extract unique platforms for filtering
        const uniquePlatforms = [...new Set(data.map(course => course.platform))].filter(Boolean);
        setPlatforms(uniquePlatforms);
      }
      
      setLoading(false);
    };

    fetchCourses();
  }, [supabase]);

  // Filter courses based on search term and platform
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.skills_covered && course.skills_covered.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
    const matchesPlatform = !filterPlatform || course.platform === filterPlatform;
    
    return matchesSearch && matchesPlatform;
  });

  if (loading) return <div className="text-center p-8">Loading courses...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <h2 className="text-2xl font-bold mb-6">Available Courses</h2>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search by title or skill
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="w-full md:w-60">
          <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by platform
          </label>
          <select
            id="platform"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Platforms</option>
            {platforms.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredCourses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold">{course.title}</h3>
              
              <div className="mt-2 flex items-center">
                <span className="text-gray-600 font-medium">{course.platform}</span>
                {course.duration && (
                  <>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-gray-600">{course.duration}</span>
                  </>
                )}
              </div>
              
              {course.skills_covered && course.skills_covered.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Skills Covered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {course.skills_covered.map((skill, index) => (
                      <span 
                        key={index} 
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between items-center">
                {course.link ? (
                  <a 
                    href={course.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center"
                  >
                    View Course
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm italic">No link available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          No courses found matching your criteria.
        </div>
      )}
    </div>
  );
}