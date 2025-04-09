import { Resend } from 'resend';

// Type for the welcome email
interface WelcomeEmailProps {
  to: string;
  name: string;
  organization: string;
  email: string;
  password: string;
  role: string;
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a welcome email with login credentials
 */
export async function sendWelcomeEmail(props: WelcomeEmailProps) {
  const { to, name, organization, email, password, role } = props;
  
  // Format the role for display
  const roleDisplay = role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  try {
    console.log(`Sending welcome email to ${to} with role ${roleDisplay}`);
    
    // Always send email regardless of environment
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `Duval Asphalt <noreply@duvalasphalt.com>`,
      to: [to],
      subject: `Welcome to ${organization} - Your Account Information`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${organization}</title>
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
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #034694;
      padding: 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .credentials {
      background-color: #f8f9fa;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #034694;
      border-radius: 4px;
    }
    .credentials p {
      margin: 10px 0;
    }
    .credentials strong {
      font-weight: 600;
      color: #034694;
    }
    .button {
      display: inline-block;
      background-color: #034694;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      margin-top: 20px;
      font-weight: 500;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #eaeaea;
    }
    .note {
      background-color: #fff8e1;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ${organization}!</h1>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>You have been added to the ${organization} safety platform with the role of <strong>${roleDisplay}</strong>.</p>
      
      <div class="credentials">
        <h2>Your Login Credentials</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      
      <div class="note">
        <strong>Important:</strong> For security reasons, please change your password after your first login.
      </div>
      
      <p>You now have access to our safety platform where you can:</p>
      <ul>
        <li>Submit safety reports and forms</li>
        <li>Access safety training materials</li>
        <li>View and manage safety data</li>
      </ul>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.duvalasphalt.com'}" class="button">Log in to your account</a>
      
      <p style="margin-top: 30px;">If you have any questions or need assistance, please contact your administrator.</p>
      <p>Thank you,<br><strong>${organization} Safety Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ${organization} Safety Platform.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Error sending email with Resend:', error);
      return { success: false, error };
    }

    console.log(`Email sent successfully to ${to} with ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
} 