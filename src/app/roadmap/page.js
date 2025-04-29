"use client";

import { useState } from 'react';

export default function Roadmap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [course, setCourse] = useState('');

  const generateRoadmap = async (courseTopic) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create a learning roadmap for ${courseTopic}. Include:
              1. A structured path with 4-6 key topics to learn in order
              2. For each topic, suggest two video resources (title and URL)
              3. For each topic, provide 1-2 practice questions
              4. Format the response as JSON with the following structure:
                 {
                   "roadmapTitle": "Learning Roadmap for [Course]",
                   "description": "Brief overview of this learning path",
                   "topics": [
                     {
                       "name": "Topic Name",
                       "description": "Brief description",
                       "videoResources": [
                         {"title": "Video Title", "url": "URL"},
                         {"title": "Video Title", "url": "URL"}
                       ],
                       "practiceQuestions": [
                         "Question 1?",
                         "Question 2?"
                       ]
                     }
                   ]
                 }`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate roadmap');
      }
      
      const data = await response.json();
      const roadmapText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Extract JSON from the response (handling potential text before/after JSON)
      const jsonMatch = roadmapText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const roadmapJson = JSON.parse(jsonMatch[0]);
          setRoadmapData(roadmapJson);
        } catch (jsonError) {
          throw new Error('Failed to parse roadmap data');
        }
      } else {
        throw new Error('Invalid roadmap format received');
      }
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = () => {
    if (course.trim()) {
      generateRoadmap(course);
    } else {
      setError('Please enter a course or topic first');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Learning Roadmap Generator</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label htmlFor="course" className="block text-lg font-medium text-gray-700 mb-2">
          What do you want to learn?
        </label>
        <input
          id="course"
          type="text"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          placeholder="e.g., React.js, Machine Learning, Python for beginners..."
        />
        
        <button
          onClick={handleGenerateRoadmap}
          disabled={loading}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition disabled:opacity-50 text-lg"
        >
          {loading ? 'Generating Roadmap...' : 'Generate Learning Roadmap'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {roadmapData && (
        <div className="bg-slate-50 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-2">{roadmapData.roadmapTitle}</h2>
          <p className="text-gray-600 mb-8 text-center">{roadmapData.description}</p>
          
          <div className="space-y-8">
            {roadmapData.topics.map((topic, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-2">{topic.name}</h3>
                <p className="text-gray-600 mb-4">{topic.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Learning Resources:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {topic.videoResources.map((video, vIndex) => (
                      <li key={vIndex}>
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {video.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">Practice Questions:</h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    {topic.practiceQuestions.map((question, qIndex) => (
                      <li key={qIndex}>{question}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
