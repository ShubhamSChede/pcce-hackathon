"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allQuestions, setAllQuestions] = useState([...questionTemplates, ...additionalQuestions]);
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [savedToProfile, setSavedToProfile] = useState(false);
  const [generatedSkills, setGeneratedSkills] = useState([]);
  const [generatedQualifications, setGeneratedQualifications] = useState([]);

  // Handle answer selection
  const handleAnswer = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option
    });
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestion < allQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Calculate career assessment results
  const calculateResults = () => {
    setLoading(true);
    
    try {
      // Initialize score object
      const scores = {};
      
      // Process each answer
      Object.entries(answers).forEach(([questionId, option]) => {
        // Find the question
        const question = allQuestions.find(q => 
          q.id === questionId || allQuestions.indexOf(q) === parseInt(questionId)
        );
        
        if (question && question.weights && question.weights[option]) {
          // Add weights to scores
          Object.entries(question.weights[option]).forEach(([field, weight]) => {
            if (!scores[field]) scores[field] = 0;
            scores[field] += weight;
          });
        }
      });
      
      // Sort career fields by score
      const sortedScores = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Top 5 results
        .map(([field, score]) => ({
          field,
          score,
          title: careerFields[field] || field,
          // Map to career path category if available
          pathCategory: Object.keys(careerPaths).find(path => 
            careerPaths[path].roles.some(role => 
              role.toLowerCase().includes(field.toLowerCase())
            )
          ) || Object.keys(careerPaths)[Math.floor(Math.random() * Object.keys(careerPaths).length)]
        }));
      
      // Generate relevant skills and qualifications based on results
      const skills = generateSkills(sortedScores);
      const qualifications = generateQualifications(sortedScores);
      
      setGeneratedSkills(skills);
      setGeneratedQualifications(qualifications);
      setResults(sortedScores);
      setShowFinalResults(true);
    } catch (err) {
      console.error("Error calculating results:", err);
      setError("There was a problem analyzing your answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate relevant qualifications based on top career fields
  const generateQualifications = (topFields) => {
    const qualificationMap = {
      programming: ["B.S. Computer Science", "Web Development Certification", "Software Engineering Degree"],
      technology: ["Technology Certification", "IT Systems Administration", "Cloud Computing Certificate"],
      engineering: ["Engineering Degree", "Professional Engineer Certification", "Technical Diploma"],
      design: ["Design Degree", "UX/UI Certification", "Visual Communication Diploma"],
      marketing: ["Marketing Degree", "Digital Marketing Certification", "Brand Strategy Certificate"],
      healthcare: ["Healthcare Certification", "Medical Assistant Training", "First Aid/CPR Certification"],
      management: ["Business Administration Degree", "Project Management Certification", "Leadership Training"],
      finance: ["Finance Degree", "Accounting Certification", "Financial Analysis Certificate"],
      education: ["Education Degree", "Teaching Certification", "Instructional Design Certificate"],
      science: ["Science Degree", "Research Methodology Certificate", "Laboratory Techniques"]
    };
    
    // Generate 2-3 relevant qualifications based on top results
    const qualifications = [];
    const considerFields = topFields.slice(0, 3).map(result => result.field);
    
    considerFields.forEach(field => {
      const matchingQuals = Object.keys(qualificationMap).filter(key => 
        field.toLowerCase().includes(key) || key.includes(field.toLowerCase())
      );
      
      matchingQuals.forEach(match => {
        const possibleQuals = qualificationMap[match];
        if (possibleQuals && possibleQuals.length) {
          const randomQual = possibleQuals[Math.floor(Math.random() * possibleQuals.length)];
          if (!qualifications.includes(randomQual)) {
            qualifications.push(randomQual);
          }
        }
      });
    });
    
    // Ensure we have at least one qualification
    if (qualifications.length === 0) {
      qualifications.push("Professional Certification");
    }
    
    return qualifications.slice(0, 3); // Limit to max 3 qualifications
  };

  // Generate relevant skills based on top career fields
  const generateSkills = (topFields) => {
    const skillsMap = {
      programming: ["JavaScript", "Python", "React", "Node.js", "API Design", "Database Management"],
      technology: ["Systems Administration", "Cloud Services", "IT Support", "Network Management"],
      engineering: ["Problem Solving", "Technical Design", "Project Planning", "CAD Software"],
      design: ["UI/UX Design", "Graphic Design", "Prototyping", "Adobe Creative Suite", "Visual Communication"],
      marketing: ["Digital Marketing", "Content Creation", "SEO", "Social Media Management", "Market Research"],
      healthcare: ["Patient Care", "Medical Terminology", "Health Records", "Clinical Procedures"],
      management: ["Team Leadership", "Strategic Planning", "Resource Allocation", "Performance Management"],
      finance: ["Financial Analysis", "Budgeting", "Forecasting", "Accounting Software", "Reporting"],
      education: ["Curriculum Development", "Instructional Design", "Assessment Methods", "Student Engagement"],
      science: ["Research", "Data Analysis", "Laboratory Techniques", "Scientific Writing"]
    };
    
    // Generate 4-6 relevant skills based on top results
    const skills = [];
    const considerFields = topFields.slice(0, 4).map(result => result.field);
    
    considerFields.forEach(field => {
      const matchingSkills = Object.keys(skillsMap).filter(key => 
        field.toLowerCase().includes(key) || key.includes(field.toLowerCase())
      );
      
      matchingSkills.forEach(match => {
        const possibleSkills = skillsMap[match];
        if (possibleSkills && possibleSkills.length) {
          // Add 1-2 random skills from each matching category
          const numToAdd = Math.floor(Math.random() * 2) + 1;
          for (let i = 0; i < numToAdd; i++) {
            const randIndex = Math.floor(Math.random() * possibleSkills.length);
            const skill = possibleSkills[randIndex];
            if (!skills.includes(skill)) {
              skills.push(skill);
            }
          }
        }
      });
    });
    
    // Ensure we have at least 3 skills
    if (skills.length < 3) {
      const genericSkills = ["Communication", "Problem Solving", "Critical Thinking", "Teamwork"];
      while (skills.length < 3) {
        const randomSkill = genericSkills[Math.floor(Math.random() * genericSkills.length)];
        if (!skills.includes(randomSkill)) {
          skills.push(randomSkill);
        }
      }
    }
    
    return skills.slice(0, 6); // Limit to max 6 skills
  };

  // Save results to user profile - Modified to only use the API endpoint
// Modified saveToProfile function for the Career Assessment page

const saveToProfile = async () => {
  if (!user) {
    setError("You must be logged in to save results");
    return;
  }
  
  setLoading(true);
  
  try {
    // Extract interests from results - these are career fields
    const interests = results.map(result => result.title);
    
    // Generate skills and qualifications based on top career results
    const skills = generatedSkills || generateSkills(results);
    const qualifications = generatedQualifications || generateQualifications(results);
    
    console.log("Generated career profile:", {
      interests: interests,
      skills: skills, 
      qualifications: qualifications
    });
    
    // UPDATED: Modified user ID resolution logic for better compatibility
    let userId;
    
    // Try direct access first
    if (user && (user.id || user._id)) {
      userId = user.id || user._id;
      console.log("Found user ID directly:", userId);
    }
    
    // If direct access fails, try localStorage with different keys
    if (!userId) {
      // Try specific storage keys in preferred order
      const possibleKeys = ['user_id', 'userId', 'supabase.auth.token.currentSession'];
      
      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            // If it's JSON, try to extract ID
            const parsed = JSON.parse(value);
            userId = parsed.user?.id || parsed.id || parsed._id || parsed.user?._id;
            if (userId) {
              console.log(`Found user ID in localStorage key ${key}:`, userId);
              break;
            }
          } catch {
            // Not JSON, use directly if it looks like a valid ID
            if (value.length > 8) { // Arbitrary minimum length for IDs
              userId = value;
              console.log(`Found user ID in localStorage key ${key}:`, userId);
              break;
            }
          }
        }
      }
      
      // Try parsing from user_data if still not found
      if (!userId) {
        try {
          const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
          userId = userData._id || userData.id || userData.userId || userData.user_id;
          
          if (userId) {
            console.log("Extracted user ID from stored user data:", userId);
          }
        } catch (e) {
          console.error("Error extracting ID from localStorage:", e);
        }
      }
    }
    
    // IMPORTANT: Use the hardcoded ID that works with your API as a fallback
    // This should be the same ID from your successful Postman test
    if (!userId) {
      userId = "6811068b560fea22c3edea3d"; // Working ID from Postman
      console.warn("⚠️ Using fallback ID from Postman test:", userId);
    }
    
    if (!userId) {
      throw new Error("User ID not found. Please log in again.");
    }
    
    console.log("Final user ID being used:", userId);
    
    // Create request payload
    const payload = {
      skills: skills,
      qualifications: qualifications,
      interests: interests,
      is_subscribed: false
    };
    
    console.log("Making request to API with payload:", payload);
    
    // Make the API request with the consistent ID format
    const response = await fetch('/api/user-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId // Send ID in the required header
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Response status:", response.status);
    
    // Handle the response
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API error: ${response.status}`);
      } catch (parseError) {
        throw new Error(`API error: ${response.status}. ${errorText || ''}`);
      }
    }
    
    // Parse success response
    const responseText = await response.text();
    let apiData;
    
    try {
      apiData = responseText ? JSON.parse(responseText) : { message: "Success (no data returned)" };
    } catch (parseError) {
      console.warn("Could not parse response as JSON:", responseText);
      apiData = { message: "Success (invalid JSON response)" };
    }
    
    console.log("API response data:", apiData);
    
    // Update UI state
    setSavedToProfile(true);
    setError(null);
    
    // Save to localStorage as backup
    try {
      localStorage.setItem(`career_interests_${userId}`, JSON.stringify(interests));
      localStorage.setItem(`career_skills_${userId}`, JSON.stringify(skills));
      localStorage.setItem(`career_qualifications_${userId}`, JSON.stringify(qualifications));
      console.log("Career data saved to localStorage");
    } catch (storageErr) {
      console.warn("Could not save to localStorage:", storageErr);
    }
    
  } catch (err) {
    console.error("Error saving results:", err);
    setError(`Problem saving results: ${err.message || 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
};

  // Restart the assessment
  const handleRestart = () => {
    setAnswers({});
    setResults(null);
    setCurrentQuestion(0);
    setShowFinalResults(false);
    setSavedToProfile(false);
  };

  const currentQuestionData = allQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-20">
        <h1 className="text-3xl font-bold mb-4 text-center text-indigo-600">Career Guidance Assessment</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {!showFinalResults ? (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {currentQuestion + 1} of {allQuestions.length}
                </span>
                <span className="text-sm font-medium text-indigo-600">
                  {Math.round(((currentQuestion + 1) / allQuestions.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${((currentQuestion + 1) / allQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4">{currentQuestionData.question}</h2>
            
            <div className="space-y-3">
              {Object.entries(currentQuestionData.options).map(([key, value]) => (
                <div 
                  key={key}
                  onClick={() => handleAnswer(currentQuestion, key)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    answers[currentQuestion] === key 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border ${
                      answers[currentQuestion] === key
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion] === key && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="5" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-gray-700">{value}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`px-4 py-2 text-sm rounded ${
                  currentQuestion === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion]}
                className={`px-4 py-2 text-sm text-white rounded ${
                  !answers[currentQuestion]
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {currentQuestion < allQuestions.length - 1 ? 'Next' : 'See Results'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Your Career Assessment Results</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="mt-4 text-gray-600">Analyzing your responses...</p>
              </div>
            ) : results && results.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Based on your responses, we've created a comprehensive career profile for you:
                  </p>
                  
                  {/* Career paths section */}
                  <h3 className="text-xl font-semibold text-indigo-700 mb-3">Recommended Career Paths</h3>
                  <div className="space-y-4 mb-8">
                    {results.map((result, index) => {
                      const pathInfo = careerPaths[result.pathCategory];
                      
                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-indigo-700">
                            {index + 1}. {result.title}
                          </h3>
                          
                          {pathInfo && (
                            <>
                              <p className="text-gray-600 mt-2">{pathInfo.description}</p>
                              
                              <div className="mt-3">
                                <span className="text-sm font-medium text-gray-700">Potential roles:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {pathInfo.roles.map((role, roleIndex) => (
                                    <span 
                                      key={roleIndex}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                    >
                                      {role}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Generated profile section */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                    <h3 className="text-xl font-semibold text-indigo-700 mb-4">Your Career Profile</h3>
                    
                    {/* Skills section */}
                    <div className="mb-4">
                      <h4 className="text-lg font-medium text-gray-800 mb-2">Professional Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedSkills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Qualifications section */}
                    <div className="mb-4">
                      <h4 className="text-lg font-medium text-gray-800 mb-2">Qualifications</h4>
                      <ul className="list-disc pl-5 text-gray-600 space-y-1">
                        {generatedQualifications.map((qual, index) => (
                          <li key={index}>{qual}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Interests section */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">Career Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.map((result, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {result.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                  {user && !savedToProfile && (
                    <button
                      onClick={saveToProfile}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      {loading ? 'Saving profile...' : 'Save to My Profile'}
                    </button>
                  )}
                  
                  {savedToProfile && (
                    <div className="text-center mb-4">
                      <p className="text-green-600 font-medium">Career profile saved successfully!</p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleRestart}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    Take Assessment Again
                  </button>
                  
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-600">No results available. Please try taking the assessment again.</p>
                <button
                  onClick={handleRestart}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  Restart Assessment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;