import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email
const DEFAULT_FROM = 'Safety-Simple <notifications@safety-simple.com>';

// Email service interface
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
  }[];
}

/**
 * Sends an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { to, subject, html, from = DEFAULT_FROM, cc, bcc, replyTo, attachments } = options;
    
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      cc,
      bcc,
      reply_to: replyTo,
      attachments
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

/**
 * Check if the email service is configured correctly
 */
export async function checkEmailService() {
  if (!process.env.RESEND_API_KEY) {
    return { configured: false, message: 'Resend API key is not configured' };
  }
  
  return { configured: true };
} 