import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { Timestamp } from 'firebase-admin/firestore';

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

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Extract metadata
  const { organizationName, userId, adminCount, analystCount, userCount, billingCycle } = session.metadata || {};
  
  if (!organizationName || !userId) {
    console.error('Missing required metadata');
    return;
  }
  
  const subscriptionId = session.subscription as string;
  
  // Get subscription details to confirm license counts
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Determine which price IDs to use based on the billing cycle
  const adminPriceId = billingCycle === 'yearly' 
    ? process.env.STRIPE_ADMIN_YEARLY_PRICE_ID 
    : process.env.STRIPE_ADMIN_PRICE_ID;
  
  const analystPriceId = billingCycle === 'yearly' 
    ? process.env.STRIPE_ANALYST_YEARLY_PRICE_ID 
    : process.env.STRIPE_ANALYST_PRICE_ID;
  
  const userPriceId = billingCycle === 'yearly' 
    ? process.env.STRIPE_USER_YEARLY_PRICE_ID 
    : process.env.STRIPE_USER_PRICE_ID;
  
  // Create organization document
  const orgRef = db.collection('organizations').doc();
  await orgRef.set({
    name: organizationName,
    createdAt: Timestamp.now(),
    subscriptionId,
    stripeCustomerId: subscription.customer as string,
    billingCycle: billingCycle || 'monthly',
    licenses: {
      admin: {
        total: parseInt(adminCount || '1', 10),
        used: 1, // The creator is automatically an admin
        priceId: adminPriceId,
      },
      analyst: {
        total: parseInt(analystCount || '0', 10),
        used: 0,
        priceId: analystPriceId,
      },
      user: {
        total: parseInt(userCount || '0', 10),
        used: 0,
        priceId: userPriceId,
      },
    },
    members: {
      [userId]: {
        role: 'admin',
        addedAt: Timestamp.now(),
      },
    },
  });
  
  // Update user with organization ID
  await db.collection('users').doc(userId).update({
    organizationId: orgRef.id,
    role: 'admin',
  });

  console.log(`Organization created: ${orgRef.id} for user: ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find the organization with this subscription
  const orgSnapshot = await db.collection('organizations')
    .where('subscriptionId', '==', subscription.id)
    .get();
  
  if (orgSnapshot.empty) {
    console.error(`No organization found with subscription ID: ${subscription.id}`);
    return;
  }
  
  const orgDoc = orgSnapshot.docs[0];
  const orgData = orgDoc.data();
  
  // Update license counts based on subscription items
  const licenseCounts = {
    admin: 0,
    analyst: 0,
    user: 0,
  };
  
  // Parse line items to get license counts
  for (const item of subscription.items.data) {
    // Check for both monthly and yearly price IDs
    if (
      item.price.id === process.env.STRIPE_ADMIN_PRICE_ID || 
      item.price.id === process.env.STRIPE_ADMIN_YEARLY_PRICE_ID
    ) {
      licenseCounts.admin = item.quantity || 0;
    } else if (
      item.price.id === process.env.STRIPE_ANALYST_PRICE_ID || 
      item.price.id === process.env.STRIPE_ANALYST_YEARLY_PRICE_ID
    ) {
      licenseCounts.analyst = item.quantity || 0;
    } else if (
      item.price.id === process.env.STRIPE_USER_PRICE_ID || 
      item.price.id === process.env.STRIPE_USER_YEARLY_PRICE_ID
    ) {
      licenseCounts.user = item.quantity || 0;
    }
  }
  
  // Update organization with new license counts
  await orgDoc.ref.update({
    'licenses.admin.total': licenseCounts.admin,
    'licenses.analyst.total': licenseCounts.analyst,
    'licenses.user.total': licenseCounts.user,
  });
  
  console.log(`Updated license counts for organization: ${orgDoc.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find the organization with this subscription
  const orgSnapshot = await db.collection('organizations')
    .where('subscriptionId', '==', subscription.id)
    .get();
  
  if (orgSnapshot.empty) {
    console.error(`No organization found with subscription ID: ${subscription.id}`);
    return;
  }
  
  const orgDoc = orgSnapshot.docs[0];
  
  // Mark the organization as inactive or handle as needed
  await orgDoc.ref.update({
    status: 'inactive',
    subscriptionStatus: 'canceled',
    updatedAt: Timestamp.now(),
  });
  
  console.log(`Marked organization as inactive: ${orgDoc.id}`);
} 