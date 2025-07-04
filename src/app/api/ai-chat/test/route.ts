import { NextRequest, NextResponse } from 'next/server';
import { chatQueryParserFlow } from '@/ai/chat-flow';

// Simple test endpoint for debugging AI chat functionality
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, testMode } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    // Test the query parser flow
    const parsedResult = await chatQueryParserFlow(message);

    // If this is a volunteer stats test, return static data
    if (parsedResult.intent === 'VOLUNTEER_STATS' && testMode) {
      const staticVolunteerData = [
        {
          id: 'v1',
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@example.com',
          seva_category: 'Hospitality',
          gm_family: true
        },
        {
          id: 'v2',
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane.doe@example.com',
          seva_category: 'Hospitality',
          gm_family: false
        },
        {
          id: 'v3',
          first_name: 'Bob',
          last_name: 'Johnson',
          email: 'bob.johnson@example.com',
          seva_category: 'Hospitality',
          gm_family: true
        }
      ];

      return NextResponse.json({
        type: 'volunteer_stats',
        data: {
          data: staticVolunteerData,
          stats: {
            total: 3,
            gmFamily: 2,
            nonGmFamily: 1
          },
          title: 'Static Test - Volunteers in Hospitality',
          message: 'This is static test data for the DataTable component.'
        }
      });
    }

    const response = {
      originalQuery: message,
      parsedIntent: parsedResult,
      timestamp: new Date().toISOString(),
      testMode: testMode || false
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in AI Chat Test API:', error);
    return NextResponse.json({ 
      error: 'Test endpoint failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for basic health check
export async function GET() {
  return NextResponse.json({
    status: 'AI Chat Test Endpoint Active',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: '/api/ai-chat/test - Test query parsing',
      GET: '/api/ai-chat/test - Health check'
    },
    sampleRequest: {
      method: 'POST',
      body: {
        message: 'How many large T-shirts are left?',
        testMode: true
      }
    }
  });
}