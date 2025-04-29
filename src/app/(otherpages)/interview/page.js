'use client';
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend
);

export default function HRInterviewSimulator() {
  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes per question
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [totalInterviewTime, setTotalInterviewTime] = useState(0);
  
  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [responses, setResponses] = useState([]);
  
  // Feedback state
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [allFeedback, setAllFeedback] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null); // null, 'granted', 'denied'
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  
  // Draggable camera state
  const [cameraPosition, setCameraPosition] = useState({ x: -1, y: -1 }); // -1 means use default position
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  
  // Speech recognition reference
  const recognitionRef = useRef(null);

  // Default questions as fallback
  const defaultQuestions = [
    {
      question: "Tell me about yourself and your background.",
      context: "This is an icebreaker question to understand your professional journey.",
      expectedTopics: ["professional experience", "relevant skills", "career goals"]
    },
    {
      question: "Why are you interested in this position?",
      context: "The interviewer wants to know your motivation and if you understand the role.",
      expectedTopics: ["company knowledge", "role alignment", "career growth"]
    },
    {
      question: "Describe a challenging situation at work and how you handled it.",
      context: "This question assesses your problem-solving abilities and resilience.",
      expectedTopics: ["problem identification", "solution approach", "outcome and learning"]
    },
    {
      question: "What are your greatest strengths and weaknesses?",
      context: "This evaluates your self-awareness and honesty.",
      expectedTopics: ["relevant strengths", "genuine weakness", "improvement efforts"]
    },
    {
      question: "Where do you see yourself in five years?",
      context: "This helps understand your career aspirations and plans.",
      expectedTopics: ["career goals", "growth plans", "aspirations"]
    },
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscriptResult = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptResult += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(interimTranscript);
        if (finalTranscriptResult) {
          setFinalTranscript(prev => prev + finalTranscriptResult);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    } else {
      setError('Speech recognition is not supported in your browser.');
    }
    
    // Fetch questions on component mount
    fetchQuestionsFromAPI();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Manage speech recognition based on isListening state
  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Timer effect
  useEffect(() => {
    if (isInterviewActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isInterviewActive) {
      handleResponseSubmission();
    }
  }, [timeLeft, isInterviewActive]);

  // Function to fetch interview questions from API
  const fetchQuestionsFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call for questions
      // In production, replace with actual API endpoint
      const response = await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ questions: defaultQuestions })
          });
        }, 1000);
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interview questions');
      }

      const data = await response.json();
      
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        throw new Error('Invalid question format received');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load interview questions. Using default questions instead.');
      setQuestions(defaultQuestions);
    } finally {
      setLoading(false);
    }
  };

  // Function to analyze response using API
  const analyzeResponse = async (questionData, responseText) => {
    try {
      setIsProcessing(true);
      
      // Call our secure API endpoint instead of directly calling Gemini API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionData.question,
          response: responseText,
          context: questionData.context,
          expectedTopics: questionData.expectedTopics
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze response');
      }

      const feedback = await response.json();
      return feedback;
    } catch (err) {
      console.error('Error analyzing response:', err);
      return {
        overallScore: 5,
        strengths: ["Unable to fully analyze your response"],
        areasForImprovement: ["Technical error in analysis"],
        contentRelevance: 5,
        clarity: 5,
        confidence: 5,
        completeness: 5,
        topicsCovered: [],
        topicsMissed: [],
        improvementTips: ["Try again with a more detailed response"],
        sampleImprovedResponse: "We couldn't generate a sample improved response due to a technical error."
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Camera handling functions
  const requestCameraAccess = async () => {
    try {
      setCameraLoading(true);
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user"
        } 
      });
      
      // Check if we actually got video tracks
      if (stream.getVideoTracks().length === 0) {
        throw new Error("No video track available");
      }
      
      // Check if video track is active
      if (!stream.getVideoTracks()[0].enabled) {
        stream.getVideoTracks()[0].enabled = true;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for metadata to ensure video initializes properly
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              console.log("Camera started successfully");
              setCameraPermission('granted');
              setCameraActive(true);
              setCameraLoading(false);
            })
            .catch(err => {
              console.error("Error playing video:", err);
              setCameraError("Could not play video stream");
              setCameraLoading(false);
            });
        };
        
        videoRef.current.onerror = (err) => {
          console.error("Video element error:", err);
          setCameraError("Video element encountered an error");
          setCameraLoading(false);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission('denied');
      setCameraActive(false);
      setCameraError(error.message || "Could not access camera");
      setCameraLoading(false);
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      // Turn off camera
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setCameraError(null);
    } else {
      // Turn on camera
      await requestCameraAccess();
    }
  };

  // Handle camera drag functionality
  const handleDragStart = (e) => {
    if (dragRef.current) {
      // Get current position if using default
      if (cameraPosition.x === -1 || cameraPosition.y === -1) {
        const rect = dragRef.current.getBoundingClientRect();
        setCameraPosition({
          x: rect.left,
          y: rect.top
        });
      }
      
      setIsDragging(true);
      setDragStart({
        x: e.clientX - (cameraPosition.x === -1 ? 0 : cameraPosition.x),
        y: e.clientY - (cameraPosition.y === -1 ? 0 : cameraPosition.y)
      });
    }
  };

  const handleDragMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep camera within viewport bounds
      const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 300);
      const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 200);
      
      setCameraPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      
      // Improve dragging UX
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      
      document.body.style.userSelect = '';
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  // Reset camera position when toggling camera
  useEffect(() => {
    if (!cameraActive) {
      setCameraPosition({ x: -1, y: -1 });
    }
  }, [cameraActive]);

  const startInterview = () => {
    setIsInterviewActive(true);
    setInterviewStartTime(new Date());
    resetTimer();
    
    // Optionally request camera access when interview starts
    if (cameraPermission !== 'denied') {
      requestCameraAccess();
    }
  };

  const resetTimer = () => {
    setTimeLeft(120); // Reset to 2 minutes
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTranscript('');
    }
  };

  const handleResponseSubmission = async () => {
    // Stop listening
    setIsListening(false);
    
    // Save the response
    const currentResponse = finalTranscript;
    const updatedResponses = [...responses];
    updatedResponses[currentQuestion] = currentResponse;
    setResponses(updatedResponses);
    
    // Analyze the response
    const feedback = await analyzeResponse(questions[currentQuestion], currentResponse);
    
    // Save the feedback
    const updatedFeedback = [...allFeedback];
    updatedFeedback[currentQuestion] = feedback;
    setAllFeedback(updatedFeedback);
    setCurrentFeedback(feedback);
    setShowFeedback(true);
    
    // Reset transcript for next question
    setFinalTranscript('');
    setTranscript('');
  };

  const goToNextQuestion = () => {
    const nextQuestion = currentQuestion + 1;
    
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
      setShowFeedback(false);
      setCurrentFeedback(null);
      resetTimer();
    } else {
      // Calculate total interview time
      const endTime = new Date();
      const totalTime = Math.round((endTime - interviewStartTime) / 1000);
      setTotalInterviewTime(totalTime);
      setShowResults(true);
      setIsInterviewActive(false);
    }
  };

  const restartInterview = () => {
    setCurrentQuestion(0);
    setShowResults(false);
    setTimeLeft(120);
    setFinalTranscript('');
    setTranscript('');
    setResponses([]);
    setAllFeedback([]);
    setShowFeedback(false);
    setCurrentFeedback(null);
    setIsInterviewActive(false);
    // Optionally fetch new questions
    fetchQuestionsFromAPI();
  };

  // Generate chart data for the results screen
  const generateChartData = () => {
    // Radar chart data for skills assessment
    const skillsData = {
      labels: ['Content Relevance', 'Clarity', 'Confidence', 'Completeness', 'Overall Score'],
      datasets: allFeedback.map((feedback, index) => ({
        label: `Question ${index + 1}`,
        data: [
          feedback.contentRelevance, 
          feedback.clarity,
          feedback.confidence,
          feedback.completeness,
          feedback.overallScore
        ],
        backgroundColor: `rgba(${50 + index * 40}, ${100 + index * 30}, ${200 - index * 20}, 0.2)`,
        borderColor: `rgba(${50 + index * 40}, ${100 + index * 30}, ${200 - index * 20}, 1)`,
        borderWidth: 2,
      })),
    };

    // Calculate average scores
    const averageScores = {
      overallScore: allFeedback.reduce((sum, fb) => sum + fb.overallScore, 0) / allFeedback.length,
      contentRelevance: allFeedback.reduce((sum, fb) => sum + fb.contentRelevance, 0) / allFeedback.length,
      clarity: allFeedback.reduce((sum, fb) => sum + fb.clarity, 0) / allFeedback.length,
      confidence: allFeedback.reduce((sum, fb) => sum + fb.confidence, 0) / allFeedback.length,
      completeness: allFeedback.reduce((sum, fb) => sum + fb.completeness, 0) / allFeedback.length,
    };

    return { skillsData, averageScores };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 10
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
  };

  return (
    <div className=" bg-gradient-to-b from-indigo-50 to-gray-100 min-h-screen py-8 font-inter">
      <Head>
        <title>HR Interview Simulator</title>
        <meta name="description" content="Practice your interview skills with AI feedback" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Camera preview - now draggable */}
      {(cameraActive || cameraLoading) && (
        <div 
          ref={dragRef}
          className={`fixed z-50 rounded-lg overflow-hidden shadow-lg border-2 ${isDragging ? 'border-blue-500' : 'border-indigo-300'} bg-black cursor-move`}
          style={{
            bottom: cameraPosition.y === -1 ? '1rem' : 'auto',
            right: cameraPosition.x === -1 ? '1rem' : 'auto',
            top: cameraPosition.y !== -1 ? `${cameraPosition.y}px` : 'auto',
            left: cameraPosition.x !== -1 ? `${cameraPosition.x}px` : 'auto',
            transition: isDragging ? 'none' : 'box-shadow 0.2s ease-in-out',
            boxShadow: isDragging ? '0 0 0 3px rgba(59, 130, 246, 0.5)' : ''
          }}
          onMouseDown={handleDragStart}
        >
          <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 flex items-center justify-between">
            <span className="truncate">Camera Preview</span>
            <span className="text-xs text-gray-300">(Drag to move)</span>
          </div>
          
          {cameraLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
              <div className="text-white text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm">{cameraError}</p>
              </div>
            </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-64 h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex space-x-2">
            <button 
              onClick={toggleCamera} 
              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
              title="Turn off camera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">HR Interview Simulator</h1>
        <p className="text-center text-gray-600 mb-6">Practice your interview responses and get AI-powered feedback</p>
        
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-6"></div>
              <p className="text-xl text-gray-700">Preparing your interview questions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <p className="text-red-600 mb-6 text-lg">{error}</p>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-colors duration-300 shadow-md hover:shadow-lg"
              onClick={() => fetchQuestionsFromAPI()}
            >
              Try Again
            </button>
          </div>
        ) : showResults ? (
          <div className="bg-white rounded-2xl shadow-xl p-10 animate-fadeIn">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Interview Performance</h2>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center">Skills Assessment</h3>
              <div className="h-80">
                <Radar 
                  data={generateChartData().skillsData} 
                  options={chartOptions} 
                />
              </div>
              <div className="mt-6 text-center">
                <p className="text-lg">Average Score: {generateChartData().averageScores.overallScore.toFixed(1)}/10</p>
              </div>
            </div>
            
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Question Breakdown</h3>
            
            <div className="space-y-6 mb-8">
              {questions.map((question, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-inner">
                  <p className="font-semibold text-lg mb-2">Question {index + 1}: {question.question}</p>
                  <div className="pl-4 border-l-4 border-gray-300 mb-4 text-gray-600 italic">
                    <p>{responses[index] || "No response recorded"}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-green-700">Strengths:</p>
                      <ul className="list-disc pl-5 text-gray-700">
                        {allFeedback[index]?.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-amber-700">Areas for Improvement:</p>
                      <ul className="list-disc pl-5 text-gray-700">
                        {allFeedback[index]?.areasForImprovement.map((area, i) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-xl shadow-inner mb-8 border border-indigo-100">
              <h3 className="text-xl font-semibold mb-4">Overall Improvement Tips</h3>
              <ul className="space-y-2">
                {Array.from(new Set(allFeedback.flatMap(fb => fb.improvementTips))).slice(0, 5).map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-center">
              <button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-10 rounded-xl transition-colors duration-300 shadow-lg text-lg"
                onClick={restartInterview}
              >
                Practice Again
              </button>
            </div>
          </div>
        ) : !isInterviewActive ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <div className="relative mb-8">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-1 rounded-full font-medium z-10 whitespace-nowrap">
                Your Virtual Interviewer
              </div>
              <div className="bg-gradient-to-b from-white to-indigo-50 rounded-2xl overflow-hidden shadow-xl border-2 border-indigo-100">
                <div className="bg-indigo-50 py-2 px-4 flex items-center border-b border-indigo-100">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-gray-600 text-sm flex-1 text-center">HR Interview Session</span>
                </div>
                <iframe 
                  src="https://my.spline.design/alinaavatarpersoncharacter-GzmuQWhvNR4hmzKKCRF9xzhX/" 
                  title="Virtual HR Interviewer"
                  className="w-full h-80 border-0"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Ready to Practice?</h2>
            <p className="text-lg text-gray-600 mb-8">
              This simulator will present you with common interview questions. You'll speak your answers, 
              and our AI will analyze your responses and provide detailed feedback.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-8 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">How It Works</h3>
              <ol className="space-y-4 text-left">
                <li className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 mt-1 flex-shrink-0">1</span>
                  <span>Click the microphone button to start recording your answer</span>
                </li>
                <li className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 mt-1 flex-shrink-0">2</span>
                  <span>You'll have 2 minutes to respond to each question</span>
                </li>
                <li className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 mt-1 flex-shrink-0">3</span>
                  <span>Submit your answer to receive AI feedback on your performance</span>
                </li>
                <li className="flex items-start">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 mt-1 flex-shrink-0">4</span>
                  <span>Complete all questions to see your overall performance report</span>
                </li>
              </ol>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-8 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Camera Access</h3>
              <p className="mb-4 text-gray-600">
                Enabling your camera helps you practice your visual presentation during the interview.
              </p>
              {cameraError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
                  {cameraError}. Please check your camera permissions and try again.
                </div>
              )}
              <button 
                className={`${cameraLoading ? 'bg-gray-400' : cameraActive ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium py-2 px-6 rounded-xl transition-colors duration-300 shadow-md flex items-center justify-center mx-auto`}
                onClick={toggleCamera}
                disabled={cameraLoading}
              >
                {cameraLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                    Accessing Camera...
                  </>
                ) : cameraActive ? 'Disable Camera' : 'Enable Camera'}
              </button>
            </div>
            
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-12 rounded-xl transition-colors duration-300 shadow-lg text-xl"
              onClick={startInterview}
            >
              Start Interview
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full">
                <div className="bg-indigo-50 py-2 px-4 flex items-center border-b border-indigo-100">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-gray-600 text-sm flex-1 text-center">HR Interviewer</span>
                </div>
                <div className="bg-gradient-to-b from-indigo-50 to-white h-full flex flex-col">
                  <div className="flex-grow">
                    <iframe 
                      src="https://my.spline.design/alinaavatarpersoncharacter-GzmuQWhvNR4hmzKKCRF9xzhX/" 
                      title="Virtual HR Interviewer"
                      className="w-full h-full min-h-[400px] border-0"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="p-4 bg-indigo-50 border-t border-indigo-100">
                    <p className="text-center text-indigo-700 font-medium">
                      {!showFeedback ? "Listening to your response..." : "Providing feedback..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 h-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium mb-2 md:mb-0">
                    Question {currentQuestion + 1}/{questions.length}
                  </span>
                  <span className={`flex items-center ${timeLeft < 30 ? 'text-red-600' : 'text-gray-700'} font-medium`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
                
                <div className="h-2 bg-gray-200 rounded-full mb-6">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                  ></div>
                </div>
                
                {!showFeedback ? (
                  <div className="animate-fadeIn">
                    <div className="mb-6 relative">
                      <span className="absolute left-0 -top-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">HR Interviewer:</span>
                      <div className="bg-gray-50 rounded-xl p-6 pl-8 border-l-4 border-indigo-500">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                          {questions[currentQuestion].question}
                        </h2>
                        <p className="text-gray-600 italic text-sm">{questions[currentQuestion].context}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <button
                          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                          onClick={toggleListening}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                        
                        <button
                          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${cameraLoading ? 'bg-gray-400' : cameraActive ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-600'}`}
                          onClick={toggleCamera}
                          disabled={cameraLoading}
                          title={cameraActive ? "Disable Camera" : "Enable Camera"}
                        >
                          {cameraLoading ? (
                            <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></div>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      <div className="text-center mb-4">
                        <span className={`text-sm font-medium ${isListening ? 'text-red-600' : 'text-gray-500'}`}>
                          {isListening ? 'Listening...' : 'Click to Start Speaking'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[100px] mb-6">
                        <span className="block text-gray-500 text-sm mb-2">Your response:</span>
                        <div>
                          {finalTranscript && <p className="text-gray-800">{finalTranscript}</p>}
                          {transcript && <p className="text-gray-400 italic">{transcript}</p>}
                          {!finalTranscript && !transcript && <p className="text-gray-400 italic">Start speaking to see your response here...</p>}
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <button 
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-8 rounded-xl transition-colors duration-300 shadow-md text-lg flex items-center"
                          onClick={handleResponseSubmission}
                          disabled={isProcessing || (!finalTranscript && !transcript)}
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin h-5 w-5 mr-2 border-b-2 border-white rounded-full"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L11 9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Submit Response
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                                    
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-1000 ease-linear" 
                        style={{ width: `${(timeLeft / 120) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fadeIn overflow-y-auto max-h-[80vh]">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Feedback on Your Response</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-medium mb-4 flex items-center text-gray-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Strengths
                        </h3>
                        <ul className="list-disc pl-5 text-gray-700">
                          {currentFeedback?.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-medium mb-4 flex items-center text-gray-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Areas for Improvement
                        </h3>
                        <ul className="list-disc pl-5 text-gray-700">
                          {currentFeedback?.areasForImprovement.map((area, index) => (
                            <li key={index}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
                        <div className="text-4xl font-bold text-indigo-600 mb-1">{currentFeedback?.contentRelevance}/10</div>
                        <div className="text-sm text-gray-600">Content Relevance</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
                        <div className="text-4xl font-bold text-indigo-600 mb-1">{currentFeedback?.clarity}/10</div>
                        <div className="text-sm text-gray-600">Clarity</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
                        <div className="text-4xl font-bold text-indigo-600 mb-1">{currentFeedback?.confidence}/10</div>
                        <div className="text-sm text-gray-600">Confidence</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
                        <div className="text-4xl font-bold text-indigo-600 mb-1">{currentFeedback?.completeness}/10</div>
                        <div className="text-sm text-gray-600">Completeness</div>
                      </div>
                    </div>
                    
                    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 mb-8">
                      <h3 className="text-lg font-medium mb-4">How to Improve</h3>
                      <ul className="space-y-2">
                        {currentFeedback?.improvementTips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
                      <h3 className="text-lg font-medium mb-4">Sample Improved Response</h3>
                      <p className="text-gray-700 italic">{currentFeedback?.sampleImprovedResponse}</p>
                    </div>
                    
                    <div className="flex justify-center mt-6">
                      <button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-colors duration-300 shadow-md text-lg flex items-center"
                        onClick={goToNextQuestion}
                      >
                        {currentQuestion < questions.length - 1 ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Next Question
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            See Results
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}