import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendDailyDigest } from '../../../../services/email/notification-service';

// Vercel cron job will call this endpoint daily
export async function GET(req: NextRequest) {
  try {
    // Check if this is a cron request with appropriate headers or authorization
    const authHeader = req.headers.get('authorization');
    
    // Simple auth check - in production, use a more secure method like API keys
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // For development, we'll allow this to be called directly
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Get all organizations
    const organizationsRef = collection(db, 'organizations');
    const organizationsSnapshot = await getDocs(organizationsRef);
    
    if (organizationsSnapshot.empty) {
      return NextResponse.json({ success: false, message: 'No organizations found' });
    }
    
    // Process each organization
    const results = [];
    
    for (const orgDoc of organizationsSnapshot.docs) {
      const organizationId = orgDoc.id;
      
      try {
        // Check if this organization has daily digest enabled
        const settingsDoc = await getDocs(
          query(
            collection(db, 'organizations', organizationId, 'settings'),
            where('notifications.reports.dailyDigest', '==', true)
          )
        );
        
        // Skip if daily digest is not enabled
        if (settingsDoc.empty) {
          continue;
        }
        
        // Send daily digest
        const result = await sendDailyDigest(organizationId);
        
        results.push({
          organizationId,
          success: result.success,
          data: result.data
        });
      } catch (error) {
        console.error(`Error processing digest for organization ${organizationId}:`, error);
        results.push({
          organizationId,
          success: false,
          error: 'Failed to send daily digest'
        });
      }
    }
    
    return NextResponse.json({ 
      success: true,
      processed: results.length,
      successCount: results.filter(r => r.success).length,
      results 
    });
  } catch (error) {
    console.error('Error processing daily digest:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Allow testing the daily digest via POST request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId } = body;
    
    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'Organization ID is required' }, { status: 400 });
    }
    
    const result = await sendDailyDigest(organizationId);
    
    return NextResponse.json({ 
      success: result.success,
      data: result.data
    });
  } catch (error) {
    console.error('Error sending test daily digest:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 