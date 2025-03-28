import { NextRequest, NextResponse } from 'next/server';
import { 
  sendTestEmail, 
  sendTestSMS, 
  testCriticalIncidentNotification,
  testFormSubmissionNotification
} from '../../../../services/email/test-email';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { Organization } from '@/types';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY 
        ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
        : '',
    }),
  });
}

// Get Firestore from Firebase Admin
const db = getFirestore();

// Helper function to get organization
async function getOrganization(organizationId: string): Promise<Organization | null> {
  try {
    const orgDoc = await db.collection('organizations').doc(organizationId).get();
    if (orgDoc.exists) {
      const orgData = orgDoc.data() || {};
      
      // Create a proper Organization object with all required fields
      const org: Organization = {
        id: orgDoc.id,
        name: orgData.name || 'Organization',
        settings: orgData.settings || {
          allowSelfRegistration: false,
          requireApprovalForSubmissions: true,
          logoURL: '',
          primaryColor: '#1e3a8a',
          secondaryColor: '#60a5fa'
        },
        license: orgData.license || {
          plan: 'starter',
          seatsTotal: 1,
          seatsUsed: 1,
          expiresAt: new Date()
        },
        createdAt: new Date(),
      };
      
      // Handle Firestore timestamps for createdAt and expiresAt
      if (orgData.createdAt && orgData.createdAt._seconds) {
        org.createdAt = new Date(orgData.createdAt._seconds * 1000);
      }
      
      if (orgData.license?.expiresAt?._seconds) {
        org.license.expiresAt = new Date(orgData.license.expiresAt._seconds * 1000);
      }
      
      return org;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { type, email, phoneNumber, organizationId } = body;
    
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'Organization ID is required' }, { status: 400 });
    }
    
    let result: { success: boolean; data?: any; error?: unknown };
    
    switch (type) {
      case 'email':
        if (!email) {
          return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }
        
        const organization = await getOrganization(organizationId);
        if (!organization) {
          return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
        }
        
        result = await sendTestEmail(email, organization);
        break;
        
      case 'sms':
        if (!phoneNumber) {
          return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
        }
        
        result = await sendTestSMS(phoneNumber);
        break;
        
      case 'critical-incident':
        result = await testCriticalIncidentNotification(organizationId);
        break;
        
      case 'form-submission':
        result = await testFormSubmissionNotification(organizationId);
        break;
        
      default:
        return NextResponse.json({ success: false, error: 'Invalid notification type' }, { status: 400 });
    }
    
    if (!result || !result.success) {
      const errorMessage = result?.error ? 
        (typeof result.error === 'string' ? result.error : 'Failed to send test notification') : 
        'Failed to send test notification';
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error processing test notification request:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method to send test notifications' });
} 