"use client";

import { useState, useEffect } from 'react';

export default function RoadmapGame() {
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
              3. For each topic, provide 1-2 practice questions with multiple-choice answers (4 options) and indicate the correct answer
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
          // Reset game state
          setCurrentLevel(0);
          setCompletedLevels([]);
          setSelectedVideo(null);
          setShowQuiz(false);
          setCurrentQuizAnswers({});
          setQuizSubmitted(false);
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

  const handleLevelSelect = (levelIndex) => {
    // Allow selecting completed levels or the next available level
    if (completedLevels.includes(levelIndex) || levelIndex === currentLevel) {
      setCurrentLevel(levelIndex);
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
      const currentTopicQuestions = roadmapData.topics[currentLevel].practiceQuestions;
      const allCorrect = currentTopicQuestions.every((q, index) => 
        currentQuizAnswers[index] === q.correctAnswer
      );
      
      if (allCorrect) {
        // Mark level as completed
        if (!completedLevels.includes(currentLevel)) {
          setCompletedLevels([...completedLevels, currentLevel]);
        }
        
        // Advance to next level if available
        if (currentLevel < roadmapData.topics.length - 1) {
          setTimeout(() => {
            setCurrentLevel(currentLevel + 1);
            setShowQuiz(false);
            setSelectedVideo(null);
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
    return url; // Return original if not YouTube
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-6 text-center text-indigo-800">Learning Adventure Map</h1>
        
        {!roadmapData && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-8 transition-all">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Begin Your Learning Journey</h2>
            <label htmlFor="course" className="block text-lg font-medium text-gray-700 mb-3">
              What do you want to learn?
            </label>
            <input
              id="course"
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., React.js, Machine Learning, Python for beginners..."
            />
            
            <button
              onClick={handleGenerateRoadmap}
              disabled={loading}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 text-lg w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Your Adventure Map...
                </>
              ) : (
                'Generate Learning Adventure'
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
              <h2 className="text-3xl font-bold text-indigo-800">{roadmapData.roadmapTitle}</h2>
              <button 
                onClick={() => setRoadmapData(null)} 
                className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition"
              >
                New Adventure
              </button>
            </div>
            <p className="text-gray-600 mb-8 text-lg">{roadmapData.description}</p>
            
            {/* Map visualization */}
            <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-6 text-center text-indigo-700">Your Learning Path</h3>
              <div className="flex flex-wrap justify-center items-center relative">
                {roadmapData.topics.map((topic, index) => (
                  <div key={index} className="relative mx-4 mb-10">
                    {/* Path connector */}
                    {index < roadmapData.topics.length - 1 && (
                      <div className={`absolute top-8 left-24 w-16 h-2 ${isLevelCompleted(index) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    )}
                    
                    {/* Level node */}
                    <button
                      onClick={() => handleLevelSelect(index)}
                      disabled={!isLevelUnlocked(index)}
                      className={`
                        w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold
                        ${isLevelCompleted(index) ? 'bg-green-500 text-white' : 
                          index === currentLevel ? 'bg-blue-600 text-white' :
                          isLevelUnlocked(index) ? 'bg-indigo-400 text-white' : 'bg-gray-300 text-gray-500'
                        }
                        ${isLevelUnlocked(index) ? 'cursor-pointer hover:scale-110 transition' : 'cursor-not-allowed'}
                      `}
                    >
                      {index + 1}
                    </button>
                    
                    {/* Level name */}
                    <div className="mt-2 text-center w-40">
                      <p className={`font-medium ${index === currentLevel ? 'text-blue-600' : 'text-gray-700'}`}>
                        {topic.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Current level content */}
            {roadmapData && (
              <div className="bg-white rounded-xl shadow-xl p-6">
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mr-4
                    ${isLevelCompleted(currentLevel) ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                    {currentLevel + 1}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-indigo-800">{roadmapData.topics[currentLevel].name}</h3>
                    <p className="text-gray-600">{roadmapData.topics[currentLevel].description}</p>
                  </div>
                </div>
                
                {/* Learning resources */}
                <div className="mb-6">
                  <h4 className="font-bold text-xl text-indigo-700 mb-4">Learning Resources</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roadmapData.topics[currentLevel].videoResources.map((video, vIndex) => (
                      <div key={vIndex} className="bg-gray-50 rounded-lg p-4 hover:bg-indigo-50 transition cursor-pointer">
                        <button 
                          onClick={() => handleVideoSelect(video.url)}
                          className="text-left w-full"
                        >
                          <h5 className="font-semibold text-indigo-600 mb-2">{video.title}</h5>
                          <p className="text-gray-600 text-sm truncate">{video.url}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Video preview */}
                {selectedVideo && (
                  <div className="mb-6">
                    <div className="relative pb-9/16 h-96">
                      <iframe 
                        src={getVideoEmbedUrl(selectedVideo)}
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}
                
                {/* Quiz button */}
                {!showQuiz && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleStartQuiz}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
                    >
                      Take Level Quiz
                    </button>
                  </div>
                )}
                
                {/* Quiz */}
                {showQuiz && roadmapData.topics[currentLevel].practiceQuestions && (
                  <div className="mt-6 bg-indigo-50 rounded-lg p-6">
                    <h4 className="font-bold text-xl text-indigo-700 mb-4">Level {currentLevel + 1} Quiz</h4>
                    
                    {roadmapData.topics[currentLevel].practiceQuestions.map((question, qIndex) => (
                      <div key={qIndex} className="mb-6">
                        <p className="font-medium text-lg mb-3">{question.question}</p>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <div 
                              key={oIndex}
                              className={`
                                p-3 rounded-lg cursor-pointer transition
                                ${currentQuizAnswers[qIndex] === oIndex ? 'bg-indigo-200 border-2 border-indigo-400' : 'bg-white hover:bg-gray-100'}
                                ${quizSubmitted && oIndex === question.correctAnswer ? 'bg-green-100 border-2 border-green-500' : ''}
                                ${quizSubmitted && currentQuizAnswers[qIndex] === oIndex && oIndex !== question.correctAnswer ? 'bg-red-100 border-2 border-red-500' : ''}
                              `}
                              onClick={() => !quizSubmitted && handleQuizAnswer(qIndex, oIndex)}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={!isQuizReady()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition w-full disabled:opacity-50"
                      >
                        Submit Answers
                      </button>
                    ) : (
                      <div className="text-center">
                        {isLevelCompleted(currentLevel) ? (
                          <div className="p-4 bg-green-100 rounded-lg">
                            <p className="text-green-700 font-bold text-xl">🎉 Level Completed! 🎉</p>
                            {currentLevel < roadmapData.topics.length - 1 && (
                              <p className="text-green-600 mt-2">Advancing to next level...</p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-red-100 rounded-lg">
                            <p className="text-red-700 font-bold">Try again. Review the correct answers above.</p>
                            <button
                              onClick={() => setQuizSubmitted(false)}
                              className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition"
                            >
                              Try Again
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}