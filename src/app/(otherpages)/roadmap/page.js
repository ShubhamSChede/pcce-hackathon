'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function SuperMarioLearningGame() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [course, setCourse] = useState('');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [completedLevels, setCompletedLevels] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizAnswers, setCurrentQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [coinCount, setCoinCount] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

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
              text: `Create a Super Mario themed learning roadmap for ${courseTopic}. Include:
              1. A structured path with 4-6 key topics to learn in order (call them "Worlds" like in Mario)
              2. For each World, suggest two video resources (title and URL)
              3. For each World, provide 1-2 practice questions with multiple-choice answers (4 options) and indicate the correct answer
              4. Format the response as JSON with the following structure:
                 {
                   "roadmapTitle": "Super Mario Learning Adventure: [Course]",
                   "description": "Join Mario on an adventure to master [Course]!",
                   "worlds": [
                     {
                       "name": "World 1: [Topic Name]",
                       "description": "Brief description",
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
        throw new Error('Failed to generate Mario adventure');
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
            topics: roadmapJson.worlds || roadmapJson.topics
          };
          
          setRoadmapData(transformedData);
          setGameStarted(true);
          setShowIntro(false);
          // Reset game state
          setCurrentLevel(0);
          setCompletedLevels([]);
          setSelectedVideo(null);
          setShowQuiz(false);
          setCurrentQuizAnswers({});
          setQuizSubmitted(false);
          setCoinCount(0);
          setPlayerPosition(0);
        } catch (jsonError) {
          throw new Error('Failed to parse game data');
        }
      } else {
        throw new Error('Invalid game format received');
      }
    } catch (err) {
      console.error('Error generating game:', err);
      setError(err.message || 'Failed to generate Mario adventure');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = () => {
    if (course.trim()) {
      generateRoadmap(course);
    } else {
      setError('Please enter a topic for your adventure first');
    }
  };

  const handleLevelSelect = (levelIndex) => {
    // Allow selecting completed levels or the next available level
    if (completedLevels.includes(levelIndex) || levelIndex === currentLevel) {
      setCurrentLevel(levelIndex);
      setSelectedVideo(null);
      setShowQuiz(false);
      setQuizSubmitted(false);
      setPlayerPosition(levelIndex * 100);
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
      const currentTopicQuestions = roadmapData.topics[currentLevel].practiceQuestions;
      const allCorrect = currentTopicQuestions.every((q, index) => 
        currentQuizAnswers[index] === q.correctAnswer
      );
      
      if (allCorrect) {
        // Mark level as completed and add coins
        if (!completedLevels.includes(currentLevel)) {
          setCompletedLevels([...completedLevels, currentLevel]);
          setCoinCount(coinCount + 50);
        }
        
        // Play completion sound
        const audio = new Audio('https://www.myinstants.com/media/sounds/smb_powerup.mp3');
        audio.play().catch(e => console.error("Audio play failed:", e));
        
        // Advance to next level if available
        if (currentLevel < roadmapData.topics.length - 1) {
          setTimeout(() => {
            setCurrentLevel(currentLevel + 1);
            setShowQuiz(false);
            setSelectedVideo(null);
            setPlayerPosition((currentLevel + 1) * 100);
          }, 2000);
        }
      }
    }
  };

  const isLevelUnlocked = (levelIndex) => {
    // First level is always unlocked
    if (levelIndex === 0) return true;
    // Other levels are unlocked if previous level is completed
    return completedLevels.includes(levelIndex - 1);
  };

  const isLevelCompleted = (levelIndex) => {
    return completedLevels.includes(levelIndex);
  };

  const isQuizReady = () => {
    if (!roadmapData) return false;
    const currentTopicQuestions = roadmapData.topics[currentLevel].practiceQuestions;
    return Object.keys(currentQuizAnswers).length === currentTopicQuestions.length;
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

  const renderMario = () => {
    return (
      <div 
        className="absolute bottom-0 transition-all duration-500"
        style={{ left: `${playerPosition}px` }}
      >
        <div className="w-12 h-12 relative">
          {/* Simple Mario SVG */}
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect x="10" y="2" width="12" height="10" fill="#e7373c" />
            <rect x="10" y="12" width="12" height="8" fill="#4166f5" />
            <rect x="6" y="12" width="4" height="8" fill="#e7373c" />
            <rect x="22" y="12" width="4" height="8" fill="#e7373c" />
            <rect x="10" y="20" width="4" height="4" fill="#e7373c" />
            <rect x="18" y="20" width="4" height="4" fill="#e7373c" />
            <rect x="6" y="8" width="4" height="4" fill="#ffdbac" />
            <rect x="22" y="8" width="4" height="4" fill="#ffdbac" />
            <rect x="14" y="8" width="4" height="4" fill="#ffdbac" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-400 relative overflow-hidden">
      {/* Add Navbar component */}
      <Navbar />
      
      {/* Sky background with clouds */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-16 h-8 bg-white rounded-full opacity-80 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-10 bg-white rounded-full opacity-80"></div>
        <div className="absolute top-60 left-1/3 w-20 h-8 bg-white rounded-full opacity-80 animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute top-14 right-1/4 w-14 h-7 bg-white rounded-full opacity-80"></div>
      </div>
      
      <div className="container mx-auto max-w-7xl relative z-10 pt-20 px-4"> {/* Added pt-20 for Navbar spacing */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold mb-6 text-center text-yellow-500 font-['Courier_New'] shadow-md">Super Mario Learning Adventure</h1>
          
          {roadmapData && (
            <div className="flex items-center bg-yellow-300 px-4 py-2 rounded-full shadow-md">
              <span className="mr-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FFD700">
                  <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
                  <circle cx="12" cy="12" r="6" fill="#B8860B" />
                </svg>
              </span>
              <span className="font-bold text-lg">{coinCount}</span>
            </div>
          )}
        </div>
        
        {showIntro && !gameStarted && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-8 transition-all border-4 border-red-500">
            <h2 className="text-2xl font-bold mb-4 text-center text-red-600">Welcome to Super Mario Learning Adventure!</h2>
            <p className="text-lg mb-6 text-center">Join Mario on a learning journey! Complete levels, collect coins, and become a master!</p>
            
            <label htmlFor="course" className="block text-lg font-medium text-gray-700 mb-3">
              What do you want to learn with Mario?
            </label>
            <input
              id="course"
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., Python, Web Development, Mathematics..."
            />
            
            <button
              onClick={handleGenerateRoadmap}
              disabled={loading}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 text-lg w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading Mario&apos;s Adventure...
                </>
              ) : (
                'Let&apos;s-a Go!'
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {roadmapData && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-red-600">{roadmapData.roadmapTitle}</h2>
              <button 
                onClick={() => {
                  setRoadmapData(null);
                  setShowIntro(true);
                  setGameStarted(false);
                }} 
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition"
              >
                New Adventure
              </button>
            </div>
            <p className="text-gray-800 mb-8 text-lg">{roadmapData.description}</p>
            
            {/* Two-column layout for game and quiz */}
            <div className="grid grid-cols-2 lg:grid-cols-12 gap-6">
              {/* Left column - Game world visualization and Video */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-xl shadow-xl p-6 mb-4 border-4 border-green-600">
                  <h3 className="text-xl font-bold mb-6 text-center text-red-600">Mario's Journey</h3>
                  
                  {/* Level completion bar */}
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                    <div 
                      className="bg-yellow-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${(completedLevels.length / roadmapData.topics.length) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="relative h-56 mb-8">
                    {/* Ground */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-green-500 to-green-700 rounded-lg"></div>
                    
                    {/* Level blocks */}
                    <div className="flex justify-between items-end absolute bottom-12 left-0 right-0 px-4">
                      {roadmapData.topics.map((topic, index) => (
                        <div key={index} className="relative mb-1 flex flex-col items-center">
                          {/* Path connector */}
                          {index < roadmapData.topics.length - 1 && (
                            <div className={`absolute top-8 right-[-60px] w-16 h-2 ${isLevelCompleted(index) ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                          )}
                          
                          {/* Level block */}
                          <button
                            onClick={() => handleLevelSelect(index)}
                            disabled={!isLevelUnlocked(index)}
                            className={`
                              w-16 h-16 flex items-center justify-center text-lg font-bold rounded-md
                              ${isLevelCompleted(index) ? 'bg-yellow-500 text-white border-2 border-yellow-700' : 
                                index === currentLevel ? 'bg-red-600 text-white border-2 border-red-800 animate-pulse' :
                                isLevelUnlocked(index) ? 'bg-blue-500 text-white border-2 border-blue-700' : 'bg-gray-300 text-gray-500 border-2 border-gray-400'
                              }
                              ${isLevelUnlocked(index) ? 'cursor-pointer hover:scale-110 transition' : 'cursor-not-allowed'}
                              relative
                            `}
                          >
                            <div className="absolute inset-0 border-t-4 border-l-2 border-r-2 border-t-white border-l-gray-200 border-r-gray-300 opacity-30 rounded-md"></div>
                            {index + 1}
                          </button>
                          
                          {/* Flag for completed levels */}
                          {isLevelCompleted(index) && (
                            <div className="absolute top-[-24px] right-[-2px]">
                              <div className="w-2 h-6 bg-green-800"></div>
                              <div className="w-4 h-3 bg-green-600 absolute top-0 left-2"></div>
                            </div>
                          )}
                          
                          {/* Level name */}
                          <div className="mt-2 text-center w-20">
                            <p className={`font-medium text-sm ${index === currentLevel ? 'text-red-600' : 'text-gray-700'}`}>
                              {topic.name.split(':')[0]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Mario character */}
                    {renderMario()}
                  </div>
                  
                  {/* Current world info */}
                  <div className="mt-8 bg-blue-400 rounded-xl p-4 border-2 border-blue-300">
                    <div className="flex items-center mb-4">
                      <div className={`w-10 h-10 flex items-center justify-center text-xl font-bold mr-3 rounded-md
                        ${isLevelCompleted(currentLevel) ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white'}`}>
                        {currentLevel + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-red-600">{roadmapData.topics[currentLevel].name}</h4>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{roadmapData.topics[currentLevel].description}</p>
                  </div>
                  
                  {/* Learning resources */}
                  <div className="mt-6">
                    <h4 className="font-bold text-lg text-red-600 mb-3">Power-Up Resources</h4>
                    <div className="space-y-3">
                      {roadmapData.topics[currentLevel].videoResources.map((video, vIndex) => (
                        <div key={vIndex} 
                          className={`bg-yellow-100 rounded-lg p-3 transition cursor-pointer border-2 
                            ${selectedVideo === video.url ? 'border-red-500 bg-yellow-200' : 'border-yellow-300 hover:bg-yellow-200'}`}
                        >
                          <button 
                            onClick={() => handleVideoSelect(video.url)}
                            className="text-left w-full flex items-center"
                          >
                            <div className="mr-3 flex-shrink-0">
                              {/* Mushroom power-up icon */}
                              <svg viewBox="0 0 24 24" className="w-7 h-7">
                                <rect x="8" y="4" width="8" height="16" rx="4" fill="#E53935" />
                                <rect x="6" y="12" width="12" height="8" rx="4" fill="#E53935" />
                                <circle cx="10" cy="8" r="2" fill="#FFF" />
                                <circle cx="14" cy="8" r="2" fill="#FFF" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="font-semibold text-red-600 mb-1 text-sm">{video.title}</h5>
                              <p className="text-gray-600 text-xs truncate">{video.url}</p>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {!showQuiz && !selectedVideo && (
                      <div className="flex justify-center mt-5">
                        <button
                          onClick={handleStartQuiz}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition transform hover:scale-105 border-b-4 border-green-800 animate-bounce"
                          style={{animationDuration: '2s'}}
                        >
                          Challenge Boss Quiz!
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Game completed notification - show when all levels are completed */}
                {roadmapData && completedLevels.length === roadmapData.topics.length && (
                  <div className="bg-yellow-100 border-4 border-yellow-500 p-6 rounded-xl text-center mt-4">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Congratulations!</h2>
                    <p className="text-lg mb-2">You've completed the entire Super Mario Learning Adventure!</p>
                    <p className="font-bold text-yellow-600">Total Coins Earned: {coinCount}</p>
                    <p className="mt-4">Princess Peach (and your knowledge) has been saved!</p>
                    {/* Replace image with SVG */}
                    <div className="flex justify-center mt-4">
                      <div className="w-24 h-24 relative">
                        <svg viewBox="0 0 32 32" className="w-full h-full">
                          <rect x="10" y="2" width="12" height="12" fill="#FFD700" />
                          <rect x="6" y="6" width="4" height="8" fill="#FFD700" />
                          <rect x="22" y="6" width="4" height="8" fill="#FFD700" />
                          <circle cx="12" cy="8" r="2" fill="#B8860B" />
                          <circle cx="20" cy="8" r="2" fill="#B8860B" />
                          <rect x="14" y="14" width="4" height="2" fill="#B8860B" />
                          <rect x="8" y="22" width="4" height="4" fill="#F57C00" />
                          <rect x="20" y="22" width="4" height="4" fill="#F57C00" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Update quiz submission success message */}
                {quizSubmitted && isLevelCompleted(currentLevel) && (
                  <div className="p-6 bg-green-100 rounded-lg border-2 border-green-300 text-center">
                    <p className="text-green-700 font-bold text-2xl mb-2">🎉 Boss Defeated! 🎉</p>
                    <p className="text-green-700 font-bold text-xl mb-4">You earned 50 coins!</p>
                    {currentLevel < roadmapData.topics.length - 1 && (
                      <p className="text-green-600 mb-4">Advancing to next world...</p>
                    )}
                    {currentLevel === roadmapData.topics.length - 1 && (
                      <p className="text-green-600 mb-4">Congratulations! You've completed the entire adventure!</p>
                    )}
                    <div className="flex justify-center mt-4">
                      {/* Replace image with SVG */}
                      <svg className="w-16 h-16 animate-bounce" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="30" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
                        <circle cx="32" cy="32" r="20" fill="#B8860B"/>
                      </svg>
                    </div>
                  </div>
                )}

                {/* Continue with the rest of your component */}
                {selectedVideo && (
                  <div className="bg-white rounded-xl shadow-xl p-6 border-4 border-yellow-400 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-yellow-600">Learning Resource</h3>
                      <button 
                        onClick={() => setSelectedVideo(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative pb-9/16 h-[300px] md:h-[350px]">
                      <iframe 
                        src={getVideoEmbedUrl(selectedVideo)}
                        className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-gray-300"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleStartQuiz}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition border-b-4 border-green-800 flex items-center"
                      >
                        <span>Ready for Quiz</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {!selectedVideo && !showQuiz && roadmapData && (
                  <div className="bg-white rounded-xl shadow-xl p-8 border-4 border-blue-300 mt-4">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-bold text-gray-700 mb-2">How to play</h3>
                      <p className="text-gray-600 mb-4">1. Watch the learning resources</p>
                      <p className="text-gray-600 mb-4">2. Take the quiz to defeat the level boss</p>
                      <p className="text-gray-600 mb-4">3. Collect coins and advance to the next world</p>
                      <div className="mt-6">
                        <button
                          onClick={handleStartQuiz}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 border-b-4 border-green-800"
                        >
                          Start Quiz Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right column - Quiz only */}
              <div className="lg:col-span-7">
                {/* Quiz */}
                {showQuiz && roadmapData.topics[currentLevel].practiceQuestions && (
                  <div className="bg-red-50 rounded-xl shadow-xl p-6 border-4 border-red-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-xl text-red-600">
                        Boss Challenge: World {currentLevel + 1}
                      </h3>
                      
                      {!quizSubmitted && (
                        <button 
                          onClick={() => {setShowQuiz(false); setSelectedVideo(null);}}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {/* Boss image */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 relative">
                        {/* Bowser/boss simplified SVG */}
                        <svg viewBox="0 0 32 32" className="w-full h-full">
                          <rect x="10" y="2" width="12" height="10" fill="#F57C00" />
                          <rect x="8" y="6" width="4" height="4" fill="#F57C00" />
                          <rect x="20" y="6" width="4" height="4" fill="#F57C00" />
                          <rect x="6" y="10" width="20" height="12" fill="#F57C00" />
                          <rect x="10" y="14" width="4" height="4" fill="#FFF" />
                          <rect x="18" y="14" width="4" height="4" fill="#FFF" />
                          <rect x="12" y="18" width="8" height="2" fill="#8D6E63" />
                          <rect x="8" y="22" width="4" height="4" fill="#F57C00" />
                          <rect x="20" y="22" width="4" height="4" fill="#F57C00" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {roadmapData.topics[currentLevel].practiceQuestions.map((question, qIndex) => (
                        <div key={qIndex} className="bg-white p-5 rounded-lg shadow-sm">
                          <p className="font-medium text-lg mb-4 flex items-start">
                            <span className="bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0">
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
                                  ${currentQuizAnswers[qIndex] === oIndex ? 'bg-yellow-200 border-2 border-yellow-400' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}
                                  ${quizSubmitted && oIndex === question.correctAnswer ? 'bg-green-100 border-2 border-green-500' : ''}
                                  ${quizSubmitted && currentQuizAnswers[qIndex] === oIndex && oIndex !== question.correctAnswer ? 'bg-red-100 border-2 border-red-500' : ''}
                                `}
                                onClick={() => !quizSubmitted && handleQuizAnswer(qIndex, oIndex)}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 border-2 
                                  ${currentQuizAnswers[qIndex] === oIndex ? 'border-yellow-500 bg-yellow-500 text-white' : 'border-gray-300'}`}>
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
                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={!isQuizReady()}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-10 rounded-lg transition disabled:opacity-50 border-b-4 border-red-800 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Defeat Boss!
                        </button>
                      </div>
                    ) : (
                      <div className="mt-8">
                        {isLevelCompleted(currentLevel) ? (
                          <div className="p-6 bg-green-100 rounded-lg border-2 border-green-300 text-center">
                            <p className="text-green-700 font-bold text-2xl mb-2">🎉 Boss Defeated! 🎉</p>
                            <p className="text-green-700 font-bold text-xl mb-4">You earned 50 coins!</p>
                            {currentLevel < roadmapData.topics.length - 1 && (
                              <p className="text-green-600 mb-4">Advancing to next world...</p>
                            )}
                            {currentLevel === roadmapData.topics.length - 1 && (
                              <p className="text-green-600 mb-4">Congratulations! You've completed the entire adventure!</p>
                            )}
                            <div className="flex justify-center mt-4">
                              {/* Replace image with SVG */}
                              <svg className="w-16 h-16 animate-bounce" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="30" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
                                <circle cx="32" cy="32" r="20" fill="#B8860B"/>
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 bg-red-100 rounded-lg border-2 border-red-300 text-center">
                            <p className="text-red-700 font-bold text-xl mb-4">Oh no! The boss won this round.</p>
                            <p className="text-red-600 mb-6">Review the correct answers above and try again!</p>
                            <button
                              onClick={() => setQuizSubmitted(false)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition border-b-4 border-red-800"
                            >
                              Try Again
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {!showQuiz && roadmapData && (
                  <div className="bg-white rounded-xl shadow-xl p-8 border-4 border-blue-300 h-full flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-bold text-gray-700 mb-2">Boss Challenge Instructions</h3>
                      <p className="text-gray-600 mb-4">Ready to test your knowledge? Click the "Challenge Boss Quiz!" button on the left to start a quiz and defeat the level boss.</p>
                      <p className="text-gray-600 mb-4">Answer all questions correctly to defeat the boss and advance to the next world!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}