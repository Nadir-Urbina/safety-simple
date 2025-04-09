import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function GET(req: Request) {
  try {
    // Extract the session cookie from the request
    const cookieStore = cookies();
    const firebaseCookie = cookieStore.get('firebase-session-cookie');

    if (!firebaseCookie?.value) {
      return NextResponse.json({ 
        status: 'unauthenticated',
        message: 'No session cookie found'
      });
    }

    // Verify the session cookie with Firebase Admin
    const app = getFirebaseAdminApp();
    const auth = getAuth(app);

    try {
      const decodedClaims = await auth.verifySessionCookie(firebaseCookie.value, true);
      
      return NextResponse.json({
        status: 'authenticated',
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        role: decodedClaims.role || 'user'
      });
    } catch (error) {
      console.error('Error verifying session cookie:', error);
      return NextResponse.json({ 
        status: 'invalid',
        message: 'Session cookie verification failed'
      });
    }
  } catch (error) {
    console.error('Error in auth status check:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs'; 