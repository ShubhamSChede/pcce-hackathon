import React from 'react';

export default function CareerGuidanceResults({ careerGuidance }) {
  if (!careerGuidance) {
    return <div>No career guidance data available</div>;
  }
  
  const { careerInterests, qualifications, skillsToDevelope, nextSteps } = careerGuidance;
  
  return (
    <div className="career-guidance-results">
      {/* Career Interests Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-blue-700 mb-4">Top Career Paths</h3>
        <div className="grid grid-cols-1 gap-4">
          {careerInterests && careerInterests.map((career, index) => (
            <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-lg mb-1">{career.title}</h4>
              <p className="text-gray-700">{career.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Qualifications Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-blue-700 mb-4">Recommended Qualifications</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {qualifications && qualifications.map((qualification, index) => (
            <div key={index} className="mb-3">
              <h4 className="font-semibold text-gray-800">{qualification.name}</h4>
              <p className="text-gray-700">{qualification.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Skills To Develop Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-blue-700 mb-4">Skills To Develop</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {skillsToDevelope && skillsToDevelope.map((skill, index) => (
            <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h4 className="font-semibold">{skill.skill}</h4>
              <p className="text-gray-700 text-sm">{skill.relevance}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Next Steps Section */}
      {nextSteps && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-blue-700 mb-2">Next Steps</h3>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <p className="text-gray-800">{nextSteps}</p>
          </div>
        </div>
      )}
    </div>
  );
}
