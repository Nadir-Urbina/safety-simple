import { NextRequest, NextResponse } from 'next/server';

// Debug: log when this file is first loaded by the server
console.log('API route module loaded: /api/notifications/test-simple/route.ts');

export async function POST(req: NextRequest) {
  console.log('POST request received at /api/notifications/test-simple');
  
  try {
    // Parse the request body
    const body = await req.json();
    const { type, email, phoneNumber, organizationId } = body;
    
    console.log('Received test notification request:', { type, email, phoneNumber, organizationId });
    
    // Just return success without attempting to access Firestore
    return NextResponse.json({ 
      success: true, 
      message: 'Test endpoint working',
      receivedData: { type, email, phoneNumber, organizationId }
    });
  } catch (error) {
    console.error('Error in test-simple endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error processing request',
      errorDetails: String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('GET request received at /api/notifications/test-simple');
  return NextResponse.json({ message: 'Use POST method to send test notifications' });
} 