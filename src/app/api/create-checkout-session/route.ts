import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || ''; // Get user's email from token

    const body = await request.json();
    const { 
      adminCount = 1, 
      analystCount = 0, 
      userCount = 0, 
      organizationName,
      billingCycle = 'monthly' 
    } = body;

    // Validate input
    if (!organizationName) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    if (adminCount < 1) {
      return NextResponse.json(
        { error: 'At least one admin license is required' },
        { status: 400 }
      );
    }
    
    // Create line items for each license type using the appropriate price IDs
    const lineItems = [];
    
    if (adminCount > 0) {
      lineItems.push({
        price: billingCycle === 'yearly' 
          ? process.env.STRIPE_ADMIN_YEARLY_PRICE_ID 
          : process.env.STRIPE_ADMIN_PRICE_ID,
        quantity: adminCount,
        adjustable_quantity: { 
          enabled: true, 
          minimum: 1 
        }
      });
    }
    
    if (analystCount > 0) {
      lineItems.push({
        price: billingCycle === 'yearly' 
          ? process.env.STRIPE_ANALYST_YEARLY_PRICE_ID 
          : process.env.STRIPE_ANALYST_PRICE_ID,
        quantity: analystCount,
        adjustable_quantity: { 
          enabled: true, 
          minimum: 0 
        }
      });
    }
    
    if (userCount > 0) {
      lineItems.push({
        price: billingCycle === 'yearly' 
          ? process.env.STRIPE_USER_YEARLY_PRICE_ID 
          : process.env.STRIPE_USER_PRICE_ID,
        quantity: userCount,
        adjustable_quantity: { 
          enabled: true, 
          minimum: 0 
        }
      });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: userEmail, // Pre-fill with user's email
      success_url: `${request.headers.get('origin')}/create-organization/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/create-organization?canceled=true`,
      subscription_data: {
        trial_period_days: 14, // 14-day trial for all subscriptions
        metadata: {
          billingCycle
        }
      },
      metadata: {
        organizationName,
        userId: userId, // Use the userId from the verified token
        adminCount: String(adminCount),
        analystCount: String(analystCount),
        userCount: String(userCount),
        billingCycle
      },
    });

    return NextResponse.json({ id: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 