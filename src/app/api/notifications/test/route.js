// Import Next.js API types
import { NextResponse } from 'next/server';

// Console log to confirm when this module loads
console.log('==== API route module loaded: /api/notifications/test/route.js ====');

// Simple test email route without dependencies
export async function POST(req) {
  console.log('POST request received at /api/notifications/test');
  
  try {
    // Get the request body
    const body = await req.json();
    console.log('Request body:', body);
    
    // Just echo back the input
    return NextResponse.json({ 
      success: true, 
      message: 'API call successful',
      receivedData: body
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error processing request' 
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('GET request received at /api/notifications/test');
  return NextResponse.json({ message: 'Test API is working', timestamp: new Date().toISOString() });
} 