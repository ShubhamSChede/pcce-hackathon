"use client";
import React, { useState, useEffect } from 'react';

// Pre-defined question templates for consistent career assessment
const questionTemplates = [
  {
    category: "work_environment",
    question: "What type of work environment do you prefer?",
    options: {
      a: "Fast-paced with frequent new projects and challenges",
      b: "Structured and stable with clear procedures",
      c: "Creative and collaborative spaces with flexible schedules",
      d: "Independent work with minimal supervision"
    },
    weights: {
      a: { startup: 3, consulting: 2, projectManagement: 2 },
      b: { finance: 3, accounting: 3, administration: 2, government: 2 },
      c: { design: 3, marketing: 2, education: 2, arts: 3 },
      d: { research: 3, writing: 2, programming: 2, analysis: 2 }
    }
  },
  {
    category: "problem_solving",
    question: "How do you prefer to solve problems?",
    options: {
      a: "Analytical and methodical, breaking down complex issues",
      b: "Creative and innovative, finding unique solutions",
      c: "Collaborative, discussing with others to find the best approach",
      d: "Practical and hands-on, learning through trial and error"
    },
    weights: {
      a: { engineering: 3, analysis: 3, research: 2, finance: 2 },
      b: { design: 3, entrepreneurship: 2, marketing: 2, arts: 2 },
      c: { consulting: 2, management: 3, teaching: 2, healthcare: 2 },
      d: { trades: 3, technician: 2, culinary: 2, craftsmanship: 3 }
    }
  },
  {
    category: "motivation",
    question: "What motivates you most in your career?",
    options: {
      a: "Making a positive impact on society or helping others",
      b: "Financial rewards and stability",
      c: "Learning new skills and intellectual challenges",
      d: "Recognition and advancement opportunities"
    },
    weights: {
      a: { nonprofit: 3, healthcare: 3, education: 3, socialWork: 3 },
      b: { finance: 3, sales: 3, realestate: 2, law: 2 },
      c: { research: 3, technology: 2, science: 3, academia: 2 },
      d: { management: 3, marketing: 2, entrepreneurship: 2, politics: 2 }
    }
  },
  {
    category: "work_style",
    question: "Which best describes your preferred work style?",
    options: {
      a: "Detail-oriented and precise, following processes thoroughly",
      b: "Big-picture thinker, focusing on strategy and vision",
      c: "People-oriented, building relationships and communication",
      d: "Action-oriented, implementing ideas and seeing results"
    },
    weights: {
      a: { accounting: 3, quality: 3, engineering: 2, programming: 2 },
      b: { consulting: 3, executive: 3, strategy: 3, marketing: 2 },
      c: { hr: 3, sales: 3, counseling: 3, teaching: 2 },
      d: { entrepreneurship: 3, project: 2, operations: 2, trades: 2 }
    }
  },
  {
    category: "skills",
    question: "Which skill set are you most interested in developing?",
    options: {
      a: "Technical and specialized knowledge",
      b: "Leadership and management abilities",
      c: "Creative expression and design",
      d: "Communication and interpersonal skills"
    },
    weights: {
      a: { engineering: 3, it: 3, science: 3, medical: 2 },
      b: { management: 3, entrepreneurship: 3, executive: 2, consulting: 2 },
      c: { design: 3, arts: 3, marketing: 2, architecture: 2 },
      d: { hr: 3, sales: 2, teaching: 3, counseling: 3 }
    }
  }
];

// Additional hardcoded questions for more comprehensive assessment
const additionalQuestions = [
  {
    id: 'interests',
    category: "interests",
    question: 'What fields or subjects interest you the most?',
    options: {
      a: 'Technology & Computing',
      b: 'Healthcare & Medicine',
      c: 'Business & Finance',
      d: 'Arts & Design',
      e: 'Science & Research',
      f: 'Education & Teaching',
      g: 'Skilled Trades',
      h: 'Social Services'
    },
    weights: {
      a: { programming: 3, it: 3, technology: 3 },
      b: { healthcare: 3, medical: 3 },
      c: { finance: 3, accounting: 2, management: 2 },
      d: { arts: 3, design: 3, creative: 2 },
      e: { research: 3, science: 3, analysis: 2 },
      f: { education: 3, teaching: 3 },
      g: { trades: 3, craftsmanship: 2, technician: 2 },
      h: { socialWork: 3, counseling: 2, nonprofit: 2 }
    }
  },
  {
    id: 'skills',
    category: "skills",
    question: 'What are your strongest skills?',
    options: {
      a: 'Technical/Analytical thinking',
      b: 'Communication & People skills',
      c: 'Creativity & Artistic abilities',
      d: 'Leadership & Organization',
      e: 'Manual dexterity & Physical skills',
      f: 'Problem-solving',
      g: 'Research & Investigation',
      h: 'Teaching & Mentoring'
    },
    weights: {
      a: { engineering: 2, programming: 2, analysis: 3, research: 2 },
      b: { sales: 3, hr: 3, marketing: 2, consulting: 2 },
      c: { arts: 3, design: 3, marketing: 2 },
      d: { management: 3, executive: 2, project: 2, administration: 2 },
      e: { trades: 3, craftsmanship: 3, culinary: 2 },
      f: { consulting: 2, engineering: 2, entrepreneurship: 3 },
      g: { research: 3, science: 2, analysis: 2 },
      h: { teaching: 3, education: 3, counseling: 2, training: 2 }
    }
  },
  {
    id: 'values',
    category: "values",
    question: 'What do you value most in a career?',
    options: {
      a: 'High income potential',
      b: 'Work-life balance',
      c: 'Making a difference',
      d: 'Recognition & Status',
      e: 'Job security',
      f: 'Independence & Autonomy',
      g: 'Continuous learning',
      h: 'Creative expression'
    },
    weights: {
      a: { finance: 3, sales: 2, law: 2, executive: 3 },
      b: { government: 2, education: 2, administration: 2 },
      c: { nonprofit: 3, healthcare: 2, socialWork: 3, education: 2 },
      d: { executive: 3, marketing: 2, politics: 3 },
      e: { government: 3, healthcare: 2, accounting: 2 },
      f: { entrepreneurship: 3, consulting: 2, writing: 2 },
      g: { research: 3, science: 3, education: 2 },
      h: { arts: 3, design: 3, creative: 3, writing: 2 }
    }
  },
  {
    id: 'environment',
    category: "environment",
    question: 'What work environment do you prefer?',
    options: {
      a: 'Corporate office',
      b: 'Remote/Work from home',
      c: 'Outdoors',
      d: 'Startup/Small business',
      e: 'Hospital/Healthcare setting',
      f: 'Educational institution',
      g: 'Flexible/varying locations',
      h: 'Studio or creative space'
    },
    weights: {
      a: { finance: 2, management: 2, administration: 3, accounting: 2 },
      b: { programming: 3, writing: 3, consulting: 2 },
      c: { trades: 2, science: 1, craftsmanship: 2 },
      d: { startup: 3, entrepreneurship: 3, technology: 2 },
      e: { healthcare: 3, medical: 3, nursing: 3 },
      f: { education: 3, teaching: 3, research: 2 },
      g: { consulting: 3, sales: 2, marketing: 2 },
      h: { arts: 3, design: 3, creative: 3 }
    }
  },
  {
    id: 'education',
    category: "education",
    question: 'What is your highest level of education or what level are you planning to complete?',
    options: {
      a: 'High school diploma',
      b: 'Associate degree/Technical certification',
      c: 'Bachelor\'s degree',
      d: 'Master\'s degree',
      e: 'Doctoral degree',
      f: 'Professional degree (MD, JD, etc.)',
      g: 'Self-taught/Alternative education',
      h: 'Still deciding'
    },
    weights: {
      a: { trades: 3, sales: 2, administration: 1 },
      b: { technician: 3, trades: 2, healthcare: 2 },
      c: { business: 2, management: 2, marketing: 2, engineering: 2 },
      d: { consulting: 2, management: 3, research: 2, education: 2 },
      e: { research: 3, science: 3, academia: 3 },
      f: { medical: 3, law: 3, specialized: 3 },
      g: { entrepreneurship: 2, arts: 2, craftsmanship: 2, programming: 1 },
      h: { varies: 1 } // neutral weight
    }
  }
];

// Career field descriptions for more informative insights
const careerFields = {
  accounting: "Accounting and Financial Services",
  administration: "Administrative Services",
  analysis: "Data Analysis and Business Intelligence",
  architecture: "Architecture and Spatial Design",
  arts: "Arts and Creative Expression",
  consulting: "Business Consulting",
  counseling: "Counseling and Therapy",
  craftsmanship: "Craftsmanship and Artisanal Work",
  culinary: "Culinary Arts and Food Service",
  design: "Design (Graphic, UX, Industrial)",
  education: "Education and Training",
  engineering: "Engineering (Various Fields)",
  entrepreneurship: "Entrepreneurship and Business Ownership",
  executive: "Executive Leadership",
  finance: "Financial Management and Investment",
  government: "Government and Public Administration",
  healthcare: "Healthcare and Medicine",
  hr: "Human Resources",
  it: "Information Technology",
  law: "Legal Services",
  management: "Management and Administration",
  marketing: "Marketing and Advertising",
  medical: "Medical and Health Sciences",
  nonprofit: "Nonprofit and Social Impact",
  operations: "Operations Management",
  politics: "Politics and Public Service",
  programming: "Programming and Software Development",
  project: "Project Management",
  quality: "Quality Assurance and Control",
  realestate: "Real Estate",
  research: "Research and Development",
  sales: "Sales and Business Development",
  science: "Scientific Research and Application",
  socialWork: "Social Work and Community Services",
  startup: "Startup and Innovation",
  strategy: "Strategic Planning and Development",
  teaching: "Teaching and Education",
  technician: "Technical Support and Services",
  technology: "Technology and Innovation",
  trades: "Skilled Trades",
  writing: "Writing and Content Creation"
};

// Career paths with detailed descriptions
const careerPaths = {
  accounting: {
    title: "Accounting & Finance",
    description: "Career paths focused on financial management, reporting, analysis, and advising. Involves working with numbers, ensuring regulatory compliance, and providing financial insights.",
    roles: ["Accountant", "Financial Analyst", "Tax Specialist", "Auditor", "Financial Planner"]
  },
  creative: {
    title: "Creative & Design",
    description: "Careers centered on visual communication, artistic expression, and creating engaging user experiences. Combines technical skills with artistic vision.",
    roles: ["Graphic Designer", "UX/UI Designer", "Creative Director", "Content Creator", "Art Director"]
  },
  education: {
    title: "Education & Training",
    description: "Professions focused on teaching, developing learning materials, and helping others grow their knowledge and skills.",
    roles: ["Teacher", "Corporate Trainer", "Curriculum Developer", "Educational Consultant", "E-learning Specialist"]
  },
  engineering: {
    title: "Engineering & Technology",
    description: "Careers applying scientific principles to develop solutions, build systems, and create technologies that solve real-world problems.",
    roles: ["Software Engineer", "Civil Engineer", "Electrical Engineer", "Systems Architect", "DevOps Engineer"]
  },
  healthcare: {
    title: "Healthcare & Wellness",
    description: "Professions dedicated to improving health outcomes, providing care, and advancing medical knowledge and practice.",
    roles: ["Nurse", "Physical Therapist", "Healthcare Administrator", "Public Health Specialist", "Medical Researcher"]
  },
  management: {
    title: "Management & Leadership",
    description: "Roles focused on directing teams, optimizing operations, and guiding organizations toward their strategic goals.",
    roles: ["Project Manager", "Operations Manager", "Executive Director", "Team Lead", "Business Administrator"]
  },
  marketing: {
    title: "Marketing & Communications",
    description: "Careers centered on promoting products/services, building brand awareness, and creating compelling messaging strategies.",
    roles: ["Marketing Specialist", "Public Relations Manager", "Brand Strategist", "Social Media Manager", "Market Researcher"]
  },
  science: {
    title: "Science & Research",
    description: "Professions dedicated to advancing knowledge, conducting experiments, analyzing data, and developing new theories and applications.",
    roles: ["Research Scientist", "Lab Technician", "Data Scientist", "Environmental Scientist", "R&D Specialist"]
  },
  service: {
    title: "Social & Public Service",
    description: "Careers focused on improving community wellbeing, supporting vulnerable populations, and developing social policy.",
    roles: ["Social Worker", "Community Organizer", "Policy Analyst", "Nonprofit Administrator", "Government Relations"]
  },
  trades: {
    title: "Skilled Trades & Technical",
    description: "Hands-on professions requiring specialized technical skills, practical knowledge, and often certification or apprenticeship.",
    roles: ["Electrician", "IT Support Specialist", "Construction Manager", "Automotive Technician", "Manufacturing Technician"]
  }
};

const Page = () => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [careerInsight, setCareerInsight] = useState('');
  const [careerScores, setCareerScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);

  // Prepare questions - mix template questions with additional hardcoded ones
  const prepareQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get our template questions ready
      const baseQuestions = questionTemplates.map(q => ({
        question: q.question,
        options: q.options,
        category: q.category,
        weights: q.weights
      }));
      
      // Combine with additional hardcoded questions
      const combinedQuestions = [...baseQuestions, ...additionalQuestions];
      
      // Then get custom questions from Gemini API
      await generateCustomQuestions();
      
      // Set questions and start quiz when both steps are complete
      setQuestions(combinedQuestions);
      setQuizStarted(true);
    } catch (err) {
      setError(err.message);
      console.error('Error preparing questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate additional custom questions using the Gemini API
  const generateCustomQuestions = async () => {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate 3 insightful multiple-choice questions for a career guidance quiz that would reveal important aspects of someone's career preferences or aptitudes. Each question should have 4 options (a, b, c, d). Focus on work preferences, skills, and values that aren't already covered in this list of existing questions:

1. What type of work environment do you prefer?
2. How do you prefer to solve problems?
3. What motivates you most in your career?
4. Which best describes your preferred work style?
5. Which skill set are you most interested in developing?

Format your response as a JSON array:
[
  {
    "category": "unique_category_name",
    "question": "Question text here?", 
    "options": {
      "a": "Option A", 
      "b": "Option B", 
      "c": "Option C", 
      "d": "Option D"
    }
  },
  // more questions...
]

DO NOT include weights or other fields - just category, question and options.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions from Gemini');
      }
      
      const data = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0]);
        setCustomQuestions(parsedQuestions);
      } else {
        throw new Error('Failed to parse questions from response');
      }
    } catch (err) {
      console.error('Error generating custom questions:', err);
    }
  };

  // Calculate career field scores based on answer weights
  const calculateCareerScores = () => {
    const scores = {};
    
    // Initialize all career fields with zero scores
    Object.keys(careerFields).forEach(field => {
      scores[field] = 0;
    });
    
    // Add up the weights for each answer
    Object.entries(answers).forEach(([questionIndex, answer]) => {
      const question = questions[questionIndex];
      if (question.weights && question.weights[answer]) {
        const answerWeights = question.weights[answer];
        Object.entries(answerWeights).forEach(([field, weight]) => {
          scores[field] = (scores[field] || 0) + weight;
        });
      }
    });
    
    return scores;
  };

  // Generate career insights based on the calculated scores
  const generateCareerInsight = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate scores for different career fields
      const scores = calculateCareerScores();
      setCareerScores(scores);
      
      // Get the top 3 career fields
      const topFields = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([field, score]) => ({ field, score }));
      
      // Map to career paths
      const topCareerPaths = determineCareerPaths(topFields);
      
      // Create a string of answers for the API request
      const answersText = Object.entries(answers).map(
        ([index, value]) => `Q${parseInt(index) + 1}: ${questions[parseInt(index)].question} - Answer: ${questions[parseInt(index)].options[value]}`
      ).join('\n');

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Based on the following career quiz answers, provide personalized career guidance in a specific format.
              
              ${answersText}
              
              Based on their answers, these career fields scored highest for them:
              ${topFields.map(f => `- ${careerFields[f.field]}: ${f.score} points`).join('\n')}
              
              And these career paths might be most suitable:
              ${topCareerPaths.map(p => `- ${p.title}: ${p.description}`).join('\n')}
              
              Format your response exactly as follows:
              
              ## Key Skills
              • List 4-5 skills the person likely has or should develop based on their answers
              • Keep each bullet point brief (3-5 words)
              
              ## Career Interests
              • List 3-4 broad career areas they seem most interested in
              • Focus on their evident preferences, not just their top scores
              
              ## Qualifications to Consider
              • List 2-3 specific qualifications, certifications, or educational paths that would help them
              • Be specific (e.g., "Bachelor's in Computer Science" not just "degree")
              
              ## Recommendations
              • Provide 3-4 actionable, specific next steps they can take
              • Each should be directly related to exploring or preparing for their top career paths
              
              Keep your response concise and focused only on these sections.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch career insight from Gemini');
      }
      
      const data = await response.json();
      setCareerInsight(data.candidates[0]?.content?.parts[0]?.text || 'No career insight available');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching career insight:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map top career fields to broader career paths
  const determineCareerPaths = (topFields) => {
    const pathScores = {
      accounting: 0,
      creative: 0,
      education: 0,
      engineering: 0,
      healthcare: 0,
      management: 0,
      marketing: 0,
      science: 0,
      service: 0,
      trades: 0
    };
    
    // Field-to-path mapping with weights
    const fieldToPathMapping = {
      accounting: { accounting: 3, management: 1 },
      administration: { management: 2, service: 1 },
      analysis: { science: 2, accounting: 1 },
      architecture: { creative: 2, engineering: 2 },
      arts: { creative: 3 },
      consulting: { management: 2, service: 1 },
      counseling: { healthcare: 2, service: 2 },
      craftsmanship: { trades: 3, creative: 1 },
      culinary: { trades: 2, creative: 1 },
      design: { creative: 3, marketing: 1 },
      education: { education: 3, service: 1 },
      engineering: { engineering: 3, science: 1 },
      entrepreneurship: { management: 2, marketing: 1 },
      executive: { management: 3 },
      finance: { accounting: 3, management: 1 },
      government: { service: 3, management: 1 },
      healthcare: { healthcare: 3, service: 1 },
      hr: { management: 2, service: 1 },
      it: { engineering: 2, trades: 1 },
      law: { service: 2, management: 1 },
      management: { management: 3 },
      marketing: { marketing: 3, creative: 1 },
      medical: { healthcare: 3, science: 1 },
      nonprofit: { service: 3, management: 1 },
      operations: { management: 2, trades: 1 },
      politics: { service: 3 },
      programming: { engineering: 3, science: 1 },
      project: { management: 3 },
      quality: { management: 1, trades: 2 },
      realestate: { sales: 2, management: 1 },
      research: { science: 3, education: 1 },
      sales: { marketing: 2, management: 1 },
      science: { science: 3, education: 1 },
      socialWork: { service: 3, healthcare: 1 },
      startup: { management: 2, engineering: 1 },
      strategy: { management: 2, marketing: 1 },
      teaching: { education: 3, service: 1 },
      technician: { trades: 3, engineering: 1 },
      technology: { engineering: 3, science: 1 },
      trades: { trades: 3 },
      writing: { creative: 2, education: 1 }
    };
    
    // Calculate scores for each career path
    topFields.forEach(({ field, score }) => {
      const pathMappings = fieldToPathMapping[field] || {};
      Object.entries(pathMappings).forEach(([path, weight]) => {
        pathScores[path] += score * weight;
      });
    });
    
    // Get top 3 career paths
    return Object.entries(pathScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([path]) => careerPaths[path]);
  };

  const handleAnswerSelect = (option) => {
    setAnswers({...answers, [currentQuestionIndex]: option});
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateCareerInsight();
    }
  };

  const handleStartQuiz = () => {
    prepareQuestions();
  };

  const handleRestartQuiz = () => {
    setQuizStarted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCareerInsight('');
    setCareerScores({});
    setError(null);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Career Guidance Quiz</h1>
      
      {!quizStarted ? (
        <div className="text-center">
          <p className="mb-6">This quiz will help you discover potential career paths based on your preferences, skills, and personality. Answer thoughtfully to receive personalized career insights.</p>
          <button 
            onClick={handleStartQuiz} 
            className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-lg"
            disabled={loading}
          >
            {loading ? 'Loading Quiz...' : 'Start Career Quiz'}
          </button>
        </div>
      ) : careerInsight ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Your Career Insights</h2>
          
          <div className="mb-6 p-4 bg-gray-50 rounded border-l-4 border-blue-500">
            <div className="whitespace-pre-line">{careerInsight}</div>
          </div>
          
          <h3 className="text-xl font-semibold mb-3">Top Career Fields</h3>
          <div className="space-y-2 mb-6">
            {Object.entries(careerScores)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([field, score], index) => (
                <div key={field} className="flex items-center">
                  <div className="w-6 text-gray-500">{index + 1}.</div>
                  <div className="flex-grow">{careerFields[field]}</div>
                  <div className="w-12 text-right font-medium">{score} pts</div>
                </div>
              ))
            }
          </div>
          
          <button 
            onClick={handleRestartQuiz}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Take Quiz Again
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</div>
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {questions[currentQuestionIndex]?.category?.replace('_', ' ')}
            </div>
          </div>
          
          {questions[currentQuestionIndex] && (
            <>
              <h2 className="text-xl font-semibold mb-4">{questions[currentQuestionIndex].question}</h2>
              
              <div className="space-y-3">
                {Object.entries(questions[currentQuestionIndex].options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleAnswerSelect(key)}
                    className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors flex items-start"
                  >
                    <span className="font-semibold mr-2">{key.toUpperCase()}.</span> {value}
                  </button>
                ))}
              </div>
            </>
          )}
          
          <div className="mt-6 flex justify-between">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${((currentQuestionIndex) / (questions.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {loading && <div className="mt-4 text-center">Processing...</div>}
        </div>
      )}
      
      {error && <div className="text-red-500 mt-4 p-3 bg-red-50 rounded">Error: {error}</div>}
    </div>
  );
};

export default Page;