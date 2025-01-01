import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI with proper error handling
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface DestinationType {
  name: string;
  country: string;
  description: string;
  estimatedCost: number;
  bestTimeToVisit: string;
  highlights: string[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { temperature, type, budgetMin, budgetMax, count = 5 } = body;

    console.log('Received request:', body);

    // Use structured format for better results
    const prompt = `You are a travel expert. Based on these preferences:
    - Temperature preference: ${temperature}
    - Holiday type: ${type}
    - Budget range: $${budgetMin} - $${budgetMax}

    Provide exactly ${count} holiday destinations in this JSON format:
    {
      "destinations": [
        {
          "name": "City/Location Name",
          "country": "Country Name",
          "description": "2-3 sentence description",
          "estimatedCost": numerical_cost_in_USD,
          "bestTimeToVisit": "best season or months",
          "highlights": ["highlight1", "highlight2", "highlight3"]
        }
      ]
    }

    Ensure all costs are within the budget range and the temperature matches the preference.
    Response must be valid JSON only, no additional text.`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Generate content with safety settings
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
    });

    const response = await result.response;
    const text = response.text();

    console.log('Raw AI response:', text);

    try {
      // Try to parse the entire response first
      const parsedResponse = JSON.parse(text);
      
      if (!parsedResponse.destinations || !Array.isArray(parsedResponse.destinations)) {
        throw new Error('Invalid response format from AI');
      }

      // Validate each destination
      parsedResponse.destinations.forEach((dest: DestinationType) => {
        if (!dest.name || !dest.country || !dest.description || 
            !dest.estimatedCost || !dest.bestTimeToVisit || !Array.isArray(dest.highlights)) {
          throw new Error('Missing required fields in destination');
        }
      });

      return NextResponse.json(parsedResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Fallback: Try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = JSON.parse(jsonMatch[0]);
        if (extractedJson.destinations && Array.isArray(extractedJson.destinations)) {
          return NextResponse.json(extractedJson);
        }
      }
      throw new Error('Could not parse AI response as JSON');
    }

  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
        // Include more debug info in development
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        })
      },
      { status: 500 }
    );
  }
} 