import { NextResponse } from 'next/server';
import { sendTestEmail } from '../../../../services/email/test-email';

// Now using the real email sending functionality
export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    const { type, email, phoneNumber, organizationId } = body;
    
    console.log('Email test endpoint received request:', { type, email, phoneNumber, organizationId });
    
    if (type === 'email' && email && organizationId) {
      // Create a minimal organization object with required properties
      const organization = {
        id: organizationId,
        name: 'Safety Simple',
        settings: {
          logoURL: '/logo.png',
          brandColors: {
            primary: '#2563EB'
          }
        },
        license: {
          tier: 'standard',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        createdAt: new Date()
      };
      
      // Actually send the email using the email service
      console.log('Attempting to send real test email to:', email);
      const result = await sendTestEmail(email, organization);
      
      console.log('Email service result:', result);
      
      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Test email sent successfully!',
          data: result.data
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to send email',
          errorDetails: result.error ? String(result.error) : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // Return a meaningful error if required parameters are missing
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email address is required'
      }, { status: 400 });
    }
    
    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization ID is required'
      }, { status: 400 });
    }
    
    // Default response if type isn't 'email'
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request type'
    }, { status: 400 });
  } catch (error) {
    console.error('Error in email-test endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error processing request',
      errorDetails: String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('GET request received at email-test endpoint');
  return NextResponse.json({ message: 'Email test API is working. Use POST method to test email.' });
} 