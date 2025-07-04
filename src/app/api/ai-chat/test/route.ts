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