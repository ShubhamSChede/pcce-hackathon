import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the incoming request body
    const { question, response, context, expectedTopics } = await request.json();

    // Validate input
    if (!question || !response) {
      return NextResponse.json(
        { error: 'Missing required fields: question and response' },
        { status: 400 }
      );
    }

    // Create the prompt for Gemini
    const prompt = `
      You are an expert HR interviewer and coach. Please analyze the following interview response:
      
      Question: "${question}"
      Question Context: "${context || 'N/A'}"
      Expected Topics to Cover: ${expectedTopics ? JSON.stringify(expectedTopics) : 'N/A'}
      
      Candidate's Response: "${response}"
      
      Provide detailed feedback on the response with the following structure:
      1. Overall score (1-10)
      2. Strengths (list 2-3 bullet points)
      3. Areas for improvement (list 2-3 bullet points)
      4. Content relevance score (1-10)
      5. Clarity score (1-10)
      6. Confidence indicators score (1-10)
      7. Completeness score (1-10)
      8. Topics covered well from the expected topics
      9. Topics missed or could be elaborated more
      10. Specific tips for improvement (2-3 points)
      11. A sample improved response (1-2 paragraphs)
      
      Format your response as a JSON object with these exact keys:
      {
        "overallScore": number,
        "strengths": string[],
        "areasForImprovement": string[],
        "contentRelevance": number,
        "clarity": number,
        "confidence": number,
        "completeness": number,
        "topicsCovered": string[],
        "topicsMissed": string[],
        "improvementTips": string[],
        "sampleImprovedResponse": string
      }
    `;

    // Call Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ' // Use environment variable in production
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      throw new Error('Failed to get analysis from AI service');
    }

    const data = await geminiResponse.json();
    
    // Extract the generated text from Gemini's response
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON object from the response
    // Sometimes Gemini includes markdown formatting or extra text
    let jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                    generatedText.match(/{[\s\S]*}/);
                    
    let feedbackJson;
    if (jsonMatch) {
      try {
        feedbackJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error('Error parsing JSON from response:', e);
        throw new Error('Invalid JSON format in AI response');
      }
    } else {
      throw new Error('Could not extract JSON from AI response');
    }

    // Return the feedback to the client
    return NextResponse.json(feedbackJson);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze interview response',
        message: error.message
      }, 
      { status: 500 }
    );
  }
}
