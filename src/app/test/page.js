"use client";
import React, { useState } from 'react'

const page = () => {
  const [question, setQuestion] = useState('');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHintFromGemini = async (question) => {
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
        throw new Error('Failed to fetch hint from Gemini');
      }
      
      const data = await response.json();
      setHint(data.candidates[0]?.content?.parts[0]?.text || 'No hint available');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching hint:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      fetchHintFromGemini(question);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gemini API Hint Test</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="question" className="block mb-2">Enter your question:</label>
          <input 
            type="text" 
            id="question"
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            className="w-full p-2 border rounded"
            placeholder="Type your question here"
          />
        </div>
        <button 
          type="submit" 
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading || !question.trim()}
        >
          {loading ? 'Getting hint...' : 'Get Hint'}
        </button>
      </form>
      
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      
      {hint && (
        <div className="border p-4 rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Hint:</h2>
          <p>{hint}</p>
        </div>
      )}
    </div>
  )
}

export default page