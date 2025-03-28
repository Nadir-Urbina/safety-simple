import { sendEmail } from './email-service';
import { notifyCriticalIncident, notifyFormSubmission, notifySystemUpdate } from './notification-service';
import { Organization } from '@/types';

/**
 * Function to send a test email for verification purposes
 */
export async function sendTestEmail(email: string, organization: Organization) {
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Test Email from Safety-Simple',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f7f7f7;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 1px solid #eaeaea;
            }
            .logo {
              max-height: 60px;
              max-width: 200px;
            }
            .content {
              padding: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px 0;
              color: #888;
              font-size: 12px;
              border-top: 1px solid #eaeaea;
            }
            .highlight {
              color: #2563EB;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${organization.settings?.logoURL || '/placeholder-logo.png'}" alt="${organization.name} Logo" class="logo">
              <h2>Test Email</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>This is a test email from Safety-Simple to verify your email notifications are working correctly.</p>
              <p>If you received this email, your notification settings are properly configured.</p>
              <p>Thank you for using Safety-Simple!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${organization.name}. All rights reserved.</p>
              <p>This email was sent from Safety-Simple, your safety management platform.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    return result;
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error };
  }
}

/**
 * Function to send a test SMS alert
 */
export async function sendTestSMS(phoneNumber: string) {
  // This would connect to a real SMS service like Twilio
  // For now, we'll just simulate a success
  console.log(`Would send SMS to ${phoneNumber}`);
  return { success: true };
}

/**
 * Function to test sending a critical incident notification
 */
export async function testCriticalIncidentNotification(organizationId: string) {
  try {
    const result = await notifyCriticalIncident(
      organizationId,
      {
        incidentId: 'test-incident-id',
        title: 'TEST: Critical Incident',
        description: 'This is a test critical incident notification. Please ignore.',
        reportedBy: 'System Test',
        reportedAt: new Date(),
        location: 'Test Location',
        severity: 'critical',
      }
    );
    
    return result;
  } catch (error) {
    console.error('Error testing critical incident notification:', error);
    return { success: false, error };
  }
}

/**
 * Function to test sending a form submission notification
 */
export async function testFormSubmissionNotification(organizationId: string, userId?: string) {
  try {
    const result = await notifyFormSubmission(
      organizationId,
      {
        formId: 'test-form-id',
        formType: 'TEST: Form Submission',
        submittedBy: 'System Test',
        submittedAt: new Date(),
      },
      userId
    );
    
    return result;
  } catch (error) {
    console.error('Error testing form submission notification:', error);
    return { success: false, error };
  }
}

/**
 * Function to test sending a system update notification
 */
export async function testSystemUpdateNotification(organizationId: string) {
  try {
    const result = await notifySystemUpdate(
      organizationId,
      {
        updateTitle: 'TEST: System Update',
        updateDescription: 'This is a test system update notification. Please ignore.',
        updateType: 'Test',
        maintenanceTime: new Date(Date.now() + 86400000), // 24 hours from now
      }
    );
    
    return result;
  } catch (error) {
    console.error('Error testing system update notification:', error);
    return { success: false, error };
  }
} 