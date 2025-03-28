import { Organization } from '@/types';

interface TemplateData {
  userName: string;
  organization: Organization;
}

// Base HTML template with styling
function baseTemplate(title: string, content: string, organization: Organization) {
  const primaryColor = organization.settings?.primaryColor || '#1e3a8a';
  const logoURL = organization.settings?.logoURL || '/placeholder-logo.png';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
        .button {
          display: inline-block;
          padding: 10px 20px;
          color: white;
          background-color: ${primaryColor};
          border-radius: 4px;
          text-decoration: none;
          margin: 20px 0;
        }
        .highlight {
          color: ${primaryColor};
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoURL}" alt="${organization.name} Logo" class="logo">
          <h2>${title}</h2>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${organization.name}. All rights reserved.</p>
          <p>This email was sent from Safety-Simple, your safety management platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Critical Incident Template
export function criticalIncidentTemplate({
  incidentTitle,
  incidentDescription,
  reportedBy,
  reportedAt,
  location,
  severity,
  incidentId,
  dashboardUrl,
  userName,
  organization
}: {
  incidentTitle: string;
  incidentDescription: string;
  reportedBy: string;
  reportedAt: Date;
  location: string;
  severity: string;
  incidentId: string;
  dashboardUrl: string;
  userName: string;
  organization: Organization;
}) {
  const content = `
    <p>Hello ${userName},</p>
    <p>A critical incident has been reported in your organization:</p>
    
    <h3 class="highlight">${incidentTitle}</h3>
    
    <p><strong>Description:</strong> ${incidentDescription}</p>
    <p><strong>Reported by:</strong> ${reportedBy}</p>
    <p><strong>Date/Time:</strong> ${reportedAt.toLocaleString()}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Severity:</strong> <span class="highlight">${severity}</span></p>
    <p><strong>Incident ID:</strong> ${incidentId}</p>
    
    <p>Please review this incident as soon as possible.</p>
    
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="button">View Incident Details</a>
    </p>
    
    <p>If you have any questions, please contact your safety administrator.</p>
  `;
  
  return {
    subject: `CRITICAL: New Incident Report - ${incidentTitle}`,
    html: baseTemplate(`Critical Incident: ${incidentTitle}`, content, organization)
  };
}

// Form Submission Template
export function formSubmissionTemplate({
  formType,
  submittedBy,
  submittedAt,
  formId,
  dashboardUrl,
  userName,
  organization
}: {
  formType: string;
  submittedBy: string;
  submittedAt: Date;
  formId: string;
  dashboardUrl: string;
  userName: string;
  organization: Organization;
}) {
  const content = `
    <p>Hello ${userName},</p>
    <p>A new form has been submitted in your organization:</p>
    
    <p><strong>Form Type:</strong> ${formType}</p>
    <p><strong>Submitted by:</strong> ${submittedBy}</p>
    <p><strong>Date/Time:</strong> ${submittedAt.toLocaleString()}</p>
    <p><strong>Form ID:</strong> ${formId}</p>
    
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="button">View Form Details</a>
    </p>
  `;
  
  return {
    subject: `New Form Submission: ${formType}`,
    html: baseTemplate(`New Form Submission`, content, organization)
  };
}

// Submission Approval Template
export function submissionApprovalTemplate({
  formType,
  submittedBy,
  submittedAt,
  formId,
  dashboardUrl,
  userName,
  organization,
  status
}: {
  formType: string;
  submittedBy: string;
  submittedAt: Date;
  formId: string;
  dashboardUrl: string;
  userName: string;
  organization: Organization;
  status: 'waiting' | 'approved' | 'rejected';
}) {
  let statusText, actionText;
  
  switch (status) {
    case 'waiting':
      statusText = 'Needs Approval';
      actionText = 'Please review and approve or reject this submission.';
      break;
    case 'approved':
      statusText = 'Approved';
      actionText = 'This submission has been approved.';
      break;
    case 'rejected':
      statusText = 'Rejected';
      actionText = 'This submission has been rejected.';
      break;
  }
  
  const content = `
    <p>Hello ${userName},</p>
    <p>A submission requires your attention:</p>
    
    <p><strong>Form Type:</strong> ${formType}</p>
    <p><strong>Submitted by:</strong> ${submittedBy}</p>
    <p><strong>Date/Time:</strong> ${submittedAt.toLocaleString()}</p>
    <p><strong>Form ID:</strong> ${formId}</p>
    <p><strong>Status:</strong> <span class="highlight">${statusText}</span></p>
    
    <p>${actionText}</p>
    
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Review Submission</a>
    </p>
  `;
  
  return {
    subject: `${status === 'waiting' ? 'ACTION REQUIRED: ' : ''}Submission ${statusText} - ${formType}`,
    html: baseTemplate(`Submission ${statusText}`, content, organization)
  };
}

// System Update Template
export function systemUpdateTemplate({
  updateTitle,
  updateDescription,
  updateType,
  maintenanceTime,
  dashboardUrl,
  userName,
  organization
}: {
  updateTitle: string;
  updateDescription: string;
  updateType: string;
  maintenanceTime?: Date;
  dashboardUrl: string;
  userName: string;
  organization: Organization;
}) {
  const content = `
    <p>Hello ${userName},</p>
    <p>We have an important system update to share with you:</p>
    
    <h3 class="highlight">${updateTitle}</h3>
    
    <p><strong>Update Type:</strong> ${updateType}</p>
    <p>${updateDescription}</p>
    ${maintenanceTime ? `<p><strong>Scheduled Time:</strong> ${maintenanceTime.toLocaleString()}</p>` : ''}
    
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Visit Dashboard</a>
    </p>
  `;
  
  return {
    subject: `System Update: ${updateTitle}`,
    html: baseTemplate(`System Update`, content, organization)
  };
}

// Daily Digest Template
export function dailyDigestTemplate({
  activities,
  date,
  dashboardUrl,
  userName,
  organization
}: {
  activities: {
    type: string;
    description: string;
    time: Date;
    url?: string;
  }[];
  date: Date;
  dashboardUrl: string;
  userName: string;
  organization: Organization;
}) {
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const activitiesList = activities.map(activity => `
    <tr>
      <td>${activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      <td><strong>${activity.type}</strong></td>
      <td>${activity.description}</td>
      ${activity.url ? `<td><a href="${activity.url}" style="color:${organization.settings?.primaryColor || '#1e3a8a'}">View</a></td>` : '<td></td>'}
    </tr>
  `).join('');
  
  const content = `
    <p>Hello ${userName},</p>
    <p>Here is a summary of activities in your organization for ${dateStr}:</p>
    
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Time</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Activity</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${activitiesList.length > 0 ? activitiesList : `
            <tr>
              <td colspan="4" style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">No activities for today</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
    
    <p style="text-align: center; margin-top: 20px;">
      <a href="${dashboardUrl}" class="button">Visit Dashboard</a>
    </p>
  `;
  
  return {
    subject: `Daily Activity Digest - ${dateStr}`,
    html: baseTemplate(`Daily Digest for ${dateStr}`, content, organization)
  };
} 