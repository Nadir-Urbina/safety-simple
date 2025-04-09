import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { generateSecurePassword } from '@/lib/password-utils';
import { sendWelcomeEmail } from '@/lib/email-utils';

export async function POST(req: Request) {
  let userRecord;
  
  try {
    console.log("API: Starting user creation process");
    const { firstName, lastName, email, role, organizationId } = await req.json();
    
    if (!firstName || !lastName || !email || !role || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        message: 'All fields are required' 
      }, { status: 400 });
    }
    
    console.log(`API: Creating user for ${email} with role ${role}`);
    
    // Initialize Firebase Admin
    const app = getFirebaseAdminApp();
    const auth = getAuth(app);
    const adminDb = getFirestore(app);
    
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json({
          error: 'User already exists',
          message: `A user with email ${email} already exists`
        }, { status: 400 });
      }
    } catch (error: any) {
      // Error code auth/user-not-found means we're good to proceed
      if (error.code !== 'auth/user-not-found') {
        console.error('Error checking existing user:', error);
        return NextResponse.json({
          error: 'Failed to check if user exists',
          message: error.message
        }, { status: 500 });
      }
    }
    
    // Generate a secure temporary password
    const tempPassword = generateSecurePassword();
    console.log("API: Generated temporary password");
    
    try {
      // Create the user in Firebase Auth
      userRecord = await auth.createUser({
        email,
        password: tempPassword,
        displayName: `${firstName} ${lastName}`,
        emailVerified: false, // They'll verify when they first log in
      });
      console.log(`API: Created user in Firebase Auth with UID: ${userRecord.uid}`);
    } catch (authError: any) {
      console.error('Error creating user in Firebase Auth:', authError);
      return NextResponse.json({
        error: 'Failed to create user in Firebase Auth',
        message: authError.message
      }, { status: 500 });
    }
    
    try {
      // Create user document in Firestore using Admin SDK
      await adminDb.collection('users').doc(userRecord.uid).set({
        firstName,
        lastName,
        email,
        role,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      });
      console.log(`API: Created user document in Firestore`);
    } catch (firestoreError: any) {
      console.error('Error creating user document in Firestore:', firestoreError);
      // Don't return error yet, continue to try the next step
    }
    
    try {
      // Add the user to the organization's members collection with Admin SDK
      await adminDb.collection('organizations').doc(organizationId)
        .collection('members').doc(userRecord.uid).set({
          uid: userRecord.uid,
          role,
          status: 'active',
          addedAt: new Date(),
      });
      console.log(`API: Added user to organization members collection`);
    } catch (orgError: any) {
      console.error('Error adding user to organization:', orgError);
      // Don't return error yet, continue to try the next step
    }
    
    try {
      // Send welcome email with credentials
      // First get the organization name
      let organizationName = "Duval Asphalt"; // Default fallback name
      
      try {
        const orgDoc = await adminDb.collection('organizations').doc(organizationId).get();
        if (orgDoc.exists) {
          const orgData = orgDoc.data();
          if (orgData && orgData.name) {
            organizationName = orgData.name;
          }
        }
      } catch (orgNameError) {
        console.warn('Could not fetch organization name:', orgNameError);
        // Continue with default name
      }
      
      await sendWelcomeEmail({
        to: email,
        name: `${firstName} ${lastName}`,
        organization: organizationName,
        email: email,
        password: tempPassword,
        role: role
      });
      console.log(`API: Sent welcome email to ${email}`);
    } catch (emailError: any) {
      console.error('Error sending welcome email:', emailError);
      // Don't return error yet, complete the process
    }
    
    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: `User ${firstName} ${lastName} created successfully and email sent with credentials`
    });
    
  } catch (error: any) {
    console.error('Error in user creation process:', error);
    
    // If user was created in Auth but we failed in a later step,
    // still return a partial success to avoid trying to create the same user again
    if (userRecord?.uid) {
      return NextResponse.json({
        partialSuccess: true,
        uid: userRecord.uid,
        error: 'Completed with errors',
        message: `User created in Authentication but encountered errors: ${error.message}`,
      }, { status: 201 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create user', message: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs'; 