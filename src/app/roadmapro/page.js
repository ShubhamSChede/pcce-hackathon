'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';

export default function ProfessionalLearningRoadmap() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [course, setCourse] = useState('');
  const [currentModule, setCurrentModule] = useState(0);
  const [completedModules, setCompletedModules] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizAnswers, setCurrentQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [roadmapStarted, setRoadmapStarted] = useState(false);

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
              text: `Create a professional learning roadmap for ${courseTopic}. Include:
              1. A structured path with 4-6 key topics to learn in order (call them "Modules")
              2. For each Module, suggest two video resources (title and URL)
              3. For each Module, provide 1-2 practice questions with multiple-choice answers (4 options) and indicate the correct answer
              4. Format the response as JSON with the following structure:
                 {
                   "roadmapTitle": "Professional Learning Path: ${courseTopic}",
                   "description": "A comprehensive learning roadmap to master ${courseTopic}.",
                   "modules": [
                     {
                       "name": "Module 1: [Topic Name]",
                       "description": "Brief description of the topic and learning objectives",
                       "videoResources": [
                         {"title": "Video Title", "url": "URL"},
                         {"title": "Video Title", "url": "URL"}
                       ],
                       "practiceQuestions": [
                         {
                           "question": "Question text?",
                           "options": ["Option A", "Option B", "Option C", "Option D"],
                           "correctAnswer": 0
                         }
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
        throw new Error('Failed to generate learning roadmap');
      }
      
      const data = await response.json();
      const roadmapText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Extract JSON from the response
      const jsonMatch = roadmapText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const roadmapJson = JSON.parse(jsonMatch[0]);
          
          // Transform the data if needed to match our structure
          const transformedData = {
            ...roadmapJson,
            modules: roadmapJson.modules || roadmapJson.topics || roadmapJson.worlds
          };
          
          setRoadmapData(transformedData);
          setRoadmapStarted(true);
          setShowIntro(false);
          // Reset state
          setCurrentModule(0);
          setCompletedModules([]);
          setSelectedVideo(null);
          setShowQuiz(false);
          setCurrentQuizAnswers({});
          setQuizSubmitted(false);
          setProgressPercentage(0);
        } catch (jsonError) {
          throw new Error('Failed to parse roadmap data');
        }
      } else {
        throw new Error('Invalid roadmap format received');
      }
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err.message || 'Failed to generate learning roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = () => {
    if (course.trim()) {
      generateRoadmap(course);
    } else {
      setError('Please enter a topic for your learning roadmap first');
    }
  };

  const handleModuleSelect = (moduleIndex) => {
    // Allow selecting completed modules or the next available module
    if (completedModules.includes(moduleIndex) || moduleIndex === currentModule) {
      setCurrentModule(moduleIndex);
      setSelectedVideo(null);
      setShowQuiz(false);
      setQuizSubmitted(false);
    }
  };

  const handleVideoSelect = (videoUrl) => {
    setSelectedVideo(videoUrl);
    setShowQuiz(false);
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
    setSelectedVideo(null);
    setCurrentQuizAnswers({});
    setQuizSubmitted(false);
  };

  const handleQuizAnswer = (questionIndex, answerIndex) => {
    setCurrentQuizAnswers({
      ...currentQuizAnswers,
      [questionIndex]: answerIndex
    });
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    
    // Check if all answers are correct
    if (roadmapData) {
      const currentModuleQuestions = roadmapData.modules[currentModule].practiceQuestions;
      const allCorrect = currentModuleQuestions.every((q, index) => 
        currentQuizAnswers[index] === q.correctAnswer
      );
      
      if (allCorrect) {
        // Mark module as completed
        if (!completedModules.includes(currentModule)) {
          const newCompletedModules = [...completedModules, currentModule];
          setCompletedModules(newCompletedModules);
          
          // Update progress percentage
          const newProgress = (newCompletedModules.length / roadmapData.modules.length) * 100;
          setProgressPercentage(newProgress);
        }
        
        // Advance to next module if available
        if (currentModule < roadmapData.modules.length - 1) {
          setTimeout(() => {
            setCurrentModule(currentModule + 1);
            setShowQuiz(false);
            setSelectedVideo(null);
          }, 1500);
        }
      }
    }
  };

  const isModuleUnlocked = (moduleIndex) => {
    // First module is always unlocked
    if (moduleIndex === 0) return true;
    // Other modules are unlocked if previous module is completed
    return completedModules.includes(moduleIndex - 1);
  };

  const isModuleCompleted = (moduleIndex) => {
    return completedModules.includes(moduleIndex);
  };

  const isQuizReady = () => {
    if (!roadmapData) return false;
    const currentModuleQuestions = roadmapData.modules[currentModule].practiceQuestions;
    return Object.keys(currentQuizAnswers).length === currentModuleQuestions.length;
  };

  const getVideoEmbedUrl = (url) => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('v=') 
        ? url.split('v=')[1].split('&')[0]
        : url.includes('youtu.be/') 
          ? url.split('youtu.be/')[1].split('?')[0]
          : null;
          
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return url;
  };

  useEffect(() => {
    // Update progress when completed modules change
    if (roadmapData) {
      const progress = (completedModules.length / roadmapData.modules.length) * 100;
      setProgressPercentage(progress);
    }
  }, [completedModules, roadmapData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add the Navbar at the top */}
      <Navbar user={user} />
      
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Professional Learning Roadmap</h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Create a personalized learning path for any topic
            </p>
          </div>
          
          {showIntro && !roadmapStarted && (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Learning Roadmap</h2>
              <p className="text-gray-600 mb-8">
                Enter a topic you want to learn and we'll generate a personalized learning roadmap with curated 
                resources and assessments to track your progress.
              </p>
              
              <div className="mb-6">
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to learn?
                </label>
                <input
                  id="course"
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g., Python, Web Development, Data Science, Marketing..."
                />
              </div>
              
              <button
                onClick={handleGenerateRoadmap}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 text-lg flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Roadmap...
                  </>
                ) : (
                  'Generate Learning Roadmap'
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg max-w-3xl mx-auto">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {roadmapData && (
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{roadmapData.roadmapTitle}</h2>
                  <p className="text-gray-600 mt-1">{roadmapData.description}</p>
                </div>
                <button 
                  onClick={() => {
                    setRoadmapData(null);
                    setShowIntro(true);
                    setRoadmapStarted(false);
                  }} 
                  className="mt-4 sm:mt-0 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  New Roadmap
                </button>
              </div>
              
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Your Progress</h3>
                  <span className="text-blue-600 font-medium">{Math.round(progressPercentage)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Two-column layout for larger screens */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left column - Roadmap visualization */}
                <div className="lg:col-span-5">
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h3 className="text-xl font-bold mb-6 text-gray-900">Learning Path</h3>
                    
                    {/* Visual module progression */}
                    <div className="relative pb-6">
                      {roadmapData.modules.map((module, index) => (
                        <div key={index} className="mb-6">
                          {/* Module connection line */}
                          {index < roadmapData.modules.length - 1 && (
                            <div className="absolute left-4 top-12 w-0.5 h-20 bg-gray-200"></div>
                          )}
                          
                          <button
                            onClick={() => handleModuleSelect(index)}
                            disabled={!isModuleUnlocked(index)}
                            className={`flex items-start w-full text-left transition ${!isModuleUnlocked(index) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                          >
                            <div className="flex-shrink-0 mr-4 relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                                ${isModuleCompleted(index) ? 'bg-green-100 border-green-500 text-green-600' : 
                                  index === currentModule ? 'bg-blue-100 border-blue-500 text-blue-600' : 
                                  isModuleUnlocked(index) ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
                              >
                                {isModuleCompleted(index) ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  index + 1
                                )}
                              </div>
                            </div>
                            <div className="flex-grow">
                              <h4 className={`font-medium ${index === currentModule ? 'text-blue-600' : 'text-gray-900'}`}>
                                {module.name}
                              </h4>
                              <p className="text-gray-500 text-sm mt-1">{module.description}</p>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Current module resources */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-6 text-gray-900">Learning Resources</h3>
                    
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {roadmapData.modules[currentModule].name}
                      </h4>
                      <p className="text-gray-600 text-sm mb-4">{roadmapData.modules[currentModule].description}</p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      {roadmapData.modules[currentModule].videoResources.map((video, vIndex) => (
                        <div key={vIndex} 
                          className={`bg-gray-50 rounded-lg p-4 transition cursor-pointer border 
                            ${selectedVideo === video.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                          <button 
                            onClick={() => handleVideoSelect(video.url)}
                            className="text-left w-full flex items-start"
                          >
                            <div className="mr-3 flex-shrink-0 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 mb-1">{video.title}</h5>
                              <p className="text-gray-500 text-sm truncate">{video.url}</p>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {!showQuiz && !selectedVideo && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={handleStartQuiz}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
                        >
                          Take Assessment
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Learning path completion */}
                  {roadmapData && completedModules.length === roadmapData.modules.length && (
                    <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg text-center mt-6">
                      <div className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-green-700 mb-2">Congratulations!</h2>
                      <p className="text-green-600 mb-1">You've completed the entire learning roadmap!</p>
                      <p className="text-green-600">You're now well-equipped with knowledge in {course}.</p>
                    </div>
                  )}
                </div>
                
                {/* Right column - Content area */}
                <div className="lg:col-span-7">
                  {/* Video view */}
                  {selectedVideo && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Learning Resource</h3>
                        <button 
                          onClick={() => setSelectedVideo(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="relative pb-9/16 h-80 md:h-96 mb-4">
                        <iframe 
                          src={getVideoEmbedUrl(selectedVideo)}
                          className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-200"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={handleStartQuiz}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition flex items-center"
                        >
                          <span>Take Assessment</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Quiz/Assessment */}
                  {showQuiz && roadmapData.modules[currentModule].practiceQuestions && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">
                          Module {currentModule + 1} Assessment
                        </h3>
                        
                        {!quizSubmitted && (
                          <button 
                            onClick={() => {setShowQuiz(false); setSelectedVideo(null);}}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-8 mb-8">
                        {roadmapData.modules[currentModule].practiceQuestions.map((question, qIndex) => (
                          <div key={qIndex} className="bg-gray-50 p-5 rounded-lg">
                            <p className="font-medium text-lg mb-4 flex items-start">
                              <span className="bg-blue-100 text-blue-600 w-6 h-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0">
                                {qIndex + 1}
                              </span>
                              <span>{question.question}</span>
                            </p>
                            <div className="space-y-3 ml-8">
                              {question.options.map((option, oIndex) => (
                                <div 
                                  key={oIndex}
                                  className={`
                                    p-3 rounded-lg cursor-pointer transition flex items-center
                                    ${currentQuizAnswers[qIndex] === oIndex ? 'bg-blue-50 border border-blue-300' : 'bg-white hover:bg-gray-100 border border-gray-200'}
                                    ${quizSubmitted && oIndex === question.correctAnswer ? 'bg-green-50 border border-green-300' : ''}
                                    ${quizSubmitted && currentQuizAnswers[qIndex] === oIndex && oIndex !== question.correctAnswer ? 'bg-red-50 border border-red-300' : ''}
                                  `}
                                  onClick={() => !quizSubmitted && handleQuizAnswer(qIndex, oIndex)}
                                >
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 border 
                                    ${currentQuizAnswers[qIndex] === oIndex ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600'}`}>
                                    {String.fromCharCode(65 + oIndex)}
                                  </span>
                                  {option}
                                  
                                  {quizSubmitted && oIndex === question.correctAnswer && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  
                                  {quizSubmitted && currentQuizAnswers[qIndex] === oIndex && oIndex !== question.correctAnswer && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {!quizSubmitted ? (
                        <div className="flex justify-center">
                          <button
                            onClick={handleSubmitQuiz}
                            disabled={!isQuizReady()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition disabled:opacity-50"
                          >
                            Submit Assessment
                          </button>
                        </div>
                      ) : (
                        <div className="mt-6">
                          {isModuleCompleted(currentModule) ? (
                            <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h4 className="text-xl font-bold text-green-700 mb-2">Assessment Passed!</h4>
                              <p className="text-green-600 mb-4">You've successfully completed this module.</p>
                              {currentModule < roadmapData.modules.length - 1 && (
                                <p className="text-green-600 mb-4">Moving to the next module...</p>
                              )}
                              {currentModule === roadmapData.modules.length - 1 && (
                                <p className="text-green-600 mb-4">Congratulations! You've completed the entire learning roadmap!</p>
                              )}
                            </div>
                          ) : (
                            <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h4 className="text-xl font-bold text-red-700 mb-2">Assessment Not Passed</h4>
                              <p className="text-red-600 mb-4">Please review the correct answers and try again.</p>
                              <button
                                onClick={() => setQuizSubmitted(false)}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition"
                              >
                                Try Again
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Initial empty state */}
                  {!selectedVideo && !showQuiz && (
                    <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col items-center justify-center">
                      <div className="text-center max-w-md mx-auto py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Start learning {roadmapData.modules[currentModule].name}</h3>
                        <p className="text-gray-600 mb-6">
                          Select a video resource from the sidebar to begin learning, or take the assessment to test your knowledge.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button
                            onClick={() => handleVideoSelect(roadmapData.modules[currentModule].videoResources[0].url)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            Start Learning
                          </button>
                          <button
                            onClick={handleStartQuiz}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            Take Assessment
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}