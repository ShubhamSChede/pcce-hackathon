"use client";

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export default function ResourcesPage() {
  const [question, setQuestion] = useState('');
  const [hint, setHint] = useState('');
  const [topic, setTopic] = useState('');
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resourcesError, setResourcesError] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState(null);

  const fetchHintFromGemini = async (question) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Provide a short and simple hint for the following question: ${question}.  Do not give away the answer. Keep it to one sentence.`
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 100
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      const hintText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No hint available';
      setHint(hintText);
    } catch (err) {
      console.error('Error fetching hint:', err);
      setError('Failed to get a hint. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResourcesFromGemini = async (topic) => {
    try {
      setResourcesLoading(true);
      setResourcesError(null);
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `I need educational resources about "${topic}". Please provide:
              1. A brief explanation of the topic (2-3 paragraphs)
              2. 3-5 YouTube video links with their titles that are highly relevant tutorials or explanations
              3. 2-3 official documentation resources with links
              4. 2-3 beginner-friendly tutorial links
              5. 1-2 advanced resources for deeper learning
              
              Format your response as JSON with the following structure:
              {
                "explanation": "Text explanation here...",
                "videos": [{"title": "Video Title", "url": "https://youtube.com/..."}],
                "documentation": [{"title": "Doc Title", "url": "https://..."}],
                "tutorials": [{"title": "Tutorial Title", "url": "https://..."}],
                "advanced": [{"title": "Advanced Resource Title", "url": "https://..."}]
              }`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      const resourceText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!resourceText) {
        throw new Error('No resource data available');
      }
      
      // Extract the JSON portion from the text
      // Look for text surrounded by curly braces with improved regex
      const jsonMatch = resourceText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('JSON not found in response:', resourceText);
        throw new Error('Could not parse resource data');
      }
      
      try {
        // Try parsing the extracted JSON
        const resourcesData = JSON.parse(jsonMatch[0]);
        setResources(resourcesData);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError, 'on text:', jsonMatch[0]);
        
        // Try cleaning the JSON string and parsing again
        let cleanedJson = jsonMatch[0]
          .replace(/,\s*}/g, '}')     // Remove trailing commas in objects
          .replace(/,\s*]/g, ']');    // Remove trailing commas in arrays
          
        try {
          const resourcesData = JSON.parse(cleanedJson);
          setResources(resourcesData);
        } catch (secondError) {
          console.error('Failed to parse even after cleaning:', secondError);
          throw new Error('Could not parse resource data after cleaning');
        }
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      setResourcesError('Failed to get resources. Please try again later.');
    } finally {
      setResourcesLoading(false);
    }
  };

  const extractYoutubeVideoId = (url) => {
    if (!url) return null;
    
    // Try different YouTube URL formats
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?/]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtube\.com\/shorts\/([^?&/]*)/
    ];
    
    for (const pattern of regexPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const getEmbedUrl = (url) => {
    const youtubeId = extractYoutubeVideoId(url);
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}`;
    }
    return url;
  };
  
  const isEmbeddable = (url) => {
    if (!url) return false;
    if (extractYoutubeVideoId(url)) return true;
    return false;
  };
  
  const handlePreview = (url) => {
    setSelectedPreview({
      url: getEmbedUrl(url),
      isVideo: extractYoutubeVideoId(url) !== null
    });
  };
  
  const closePreview = () => {
    setSelectedPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      fetchHintFromGemini(question);
    }
  };

  const handleTopicSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      fetchResourcesFromGemini(topic);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      
      <div className="container mx-auto px-4 py-8 pt-20 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-blue-800">Learning Resources Hub</h1>
        
        {/* Topic Resources Search */}
        <div className="mb-12 p-6 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700">Find Learning Resources</h2>
          <p className="mb-4 text-gray-600">
            Enter a topic you want to learn about, and we&apos;ll find videos, documentation, and tutorials for you.
          </p>
          
          <form onSubmit={handleTopicSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="topic" className="block mb-2 font-medium text-gray-700">
                Topic:
              </label>
              <div className="flex gap-2">
                <input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  placeholder="e.g., React Hooks, Machine Learning, JavaScript Promises..."
                  required
                />
                <button
                  type="submit"
                  disabled={resourcesLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-70 shadow-sm font-medium flex items-center gap-2"
                >
                  {resourcesLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          
          {resourcesError && (
            <div className="p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
              <p>{resourcesError}</p>
            </div>
          )}
          
          {resources && !resourcesError && (
            <div className="mt-6">
              <h3 className="text-xl font-bold mb-4 text-blue-700 pb-2 border-b border-blue-200">{topic}</h3>
              
              {/* Explanation */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Overview
                </h4>
                <div className="p-5 bg-white rounded-md shadow-sm border border-gray-100">
                  <p className="whitespace-pre-line text-gray-700 leading-relaxed">{resources.explanation}</p>
                </div>
              </div>
              
              {/* Videos */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Video Tutorials
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.videos && resources.videos.map((video, index) => (
                    <div key={index} className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition group">
                      {extractYoutubeVideoId(video.url) ? (
                        <div className="relative aspect-video bg-gray-100">
                          <Image 
                            src={`https://img.youtube.com/vi/${extractYoutubeVideoId(video.url)}/mqdefault.jpg`}
                            alt={video.title}
                            width={320}
                            height={180}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                          <div 
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 cursor-pointer group-hover:bg-opacity-10 transition"
                            onClick={() => handlePreview(video.url)}
                          >
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0021 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-4">
                        <h5 className="font-medium text-gray-800 mb-2 line-clamp-2">{video.title}</h5>
                        <div className="flex justify-between items-center">
                          <a 
                            href={video.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition text-sm flex items-center"
                          >
                            Watch on YouTube
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <button
                            onClick={() => handlePreview(video.url)}
                            className="text-gray-600 hover:text-gray-800 transition text-sm"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Documentation */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Official Documentation
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {resources.documentation && resources.documentation.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-gray-200 rounded-md hover:bg-blue-50 transition flex items-center bg-white shadow-sm"
                    >
                      <div className="mr-3 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{doc.title}</span>
                        <p className="text-sm text-gray-600 truncate">{doc.url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Tutorials */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Beginner Tutorials
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {resources.tutorials && resources.tutorials.map((tutorial, index) => (
                    <a
                      key={index}
                      href={tutorial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-gray-200 rounded-md hover:bg-green-50 transition flex items-center bg-white shadow-sm"
                    >
                      <div className="mr-3 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{tutorial.title}</span>
                        <p className="text-sm text-gray-600 truncate">{tutorial.url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Advanced Resources */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Advanced Learning
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {resources.advanced && resources.advanced.map((advanced, index) => (
                    <a
                      key={index}
                      href={advanced.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-gray-200 rounded-md hover:bg-purple-50 transition flex items-center bg-white shadow-sm"
                    >
                      <div className="mr-3 text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{advanced.title}</span>
                        <p className="text-sm text-gray-600 truncate">{advanced.url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-medium text-gray-800">Resource Preview</h3>
              <button 
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative">
              {selectedPreview.isVideo ? (
                <div className="aspect-video">
                  <iframe
                    src={selectedPreview.url}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="h-[600px] overflow-hidden">
                  <iframe
                    src={selectedPreview.url}
                    className="w-full h-full"
                    frameBorder="0"
                  ></iframe>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50">
              <a 
                href={selectedPreview.url.replace('embed/', 'watch?v=')}
                target="_blank"
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 transition flex items-center justify-center"
              >
                Open in new tab
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}