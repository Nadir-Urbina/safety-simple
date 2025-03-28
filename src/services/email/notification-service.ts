import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { sendEmail } from './email-service';
import * as EmailTemplates from './email-templates';
import { NotificationSettings, Organization, UserData } from '@/types';

// Check if notification is enabled for a specific user
async function isNotificationEnabled(
  userId: string,
  organizationId: string,
  notificationType: keyof NotificationSettings['email']
): Promise<boolean> {
  try {
    // Get user doc to check user-specific preferences
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data() as UserData;
    
    // Check if user has enabled notifications overall
    if (userData.notifications?.disableAll) return false;
    
    // Get organization notification settings
    const settingsDoc = await getDoc(doc(db, 'organizations', organizationId, 'settings', 'notifications'));
    if (!settingsDoc.exists()) return true; // Default to true if settings don't exist
    
    const notificationSettings = settingsDoc.data() as NotificationSettings;
    
    // Check if email notifications are enabled globally
    if (!notificationSettings.email.enabled) return false;
    
    // Check for the specific notification type
    return !!notificationSettings.email[notificationType];
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return false;
  }
}

// Get organization administrators for critical notifications
async function getOrganizationAdmins(organizationId: string): Promise<UserData[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('organizationId', '==', organizationId),
      where('role', '==', 'admin')
    );
    
    const querySnapshot = await getDocs(q);
    const admins: UserData[] = [];
    
    querySnapshot.forEach(doc => {
      const userData = doc.data() as Omit<UserData, 'id'>;
      admins.push({
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
        lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate() : new Date()
      });
    });
    
    return admins;
  } catch (error) {
    console.error('Error getting organization admins:', error);
    return [];
  }
}

// Get organization object for templates
async function getOrganization(organizationId: string): Promise<Organization | null> {
  try {
    const orgDocRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgDocRef);
    
    if (orgDoc.exists()) {
      const orgData = orgDoc.data() as Omit<Organization, 'id'>;
      
      const orgWithDates = {
        id: orgDoc.id,
        ...orgData,
        createdAt: orgData.createdAt?.toDate ? orgData.createdAt.toDate() : new Date(),
      };
      
      // Handle license expiration date if it exists
      if (orgData.license && orgData.license.expiresAt) {
        orgWithDates.license = {
          ...orgData.license,
          expiresAt: orgData.license.expiresAt.toDate()
        };
      }
      
      return orgWithDates;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting organization:', error);
    return null;
  }
}

// Log notification to database for tracking
async function logNotification(
  organizationId: string,
  userId: string,
  notificationType: string,
  sentVia: 'email' | 'sms' | 'app',
  success: boolean,
  metadata: Record<string, any>
) {
  try {
    await addDoc(collection(db, 'organizations', organizationId, 'notifications'), {
      userId,
      notificationType,
      sentVia,
      success,
      metadata,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

/**
 * Notification service functions
 */

// Send critical incident notification to administrators
export async function notifyCriticalIncident(
  organizationId: string,
  incidentData: {
    incidentId: string;
    title: string;
    description: string;
    reportedBy: string;
    reportedAt: Date;
    location: string;
    severity: string;
  }
) {
  try {
    const organization = await getOrganization(organizationId);
    if (!organization) {
      console.error('Organization not found for critical incident notification');
      return { success: false, error: 'Organization not found' };
    }
    
    const admins = await getOrganizationAdmins(organizationId);
    if (admins.length === 0) {
      console.error('No administrators found for critical incident notification');
      return { success: false, error: 'No administrators found' };
    }
    
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/incidents/${incidentData.incidentId}`;
    
    // Prepare email template
    const emailPromises = admins.map(async admin => {
      // Check if this admin has critical incidents notifications enabled
      const isEnabled = await isNotificationEnabled(admin.id, organizationId, 'criticalIncidents');
      if (!isEnabled) return null;
      
      const { subject, html } = EmailTemplates.criticalIncidentTemplate({
        incidentTitle: incidentData.title,
        incidentDescription: incidentData.description,
        reportedBy: incidentData.reportedBy,
        reportedAt: incidentData.reportedAt,
        location: incidentData.location,
        severity: incidentData.severity,
        incidentId: incidentData.incidentId,
        dashboardUrl,
        userName: admin.firstName || admin.email.split('@')[0],
        organization
      });
      
      // Send email
      const result = await sendEmail({
        to: admin.email,
        subject,
        html
      });
      
      // Log the notification
      await logNotification(
        organizationId,
        admin.id,
        'criticalIncident',
        'email',
        result.success,
        {
          incidentId: incidentData.incidentId,
          subject
        }
      );
      
      return result;
    });
    
    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r && r.success).length;
    
    return {
      success: successCount > 0,
      data: {
        totalAdmins: admins.length,
        notifiedAdmins: successCount
      }
    };
  } catch (error) {
    console.error('Error sending critical incident notification:', error);
    return { success: false, error };
  }
}

// Notify about new form submissions
export async function notifyFormSubmission(
  organizationId: string,
  formData: {
    formId: string;
    formType: string;
    submittedBy: string;
    submittedAt: Date;
  },
  notifyUserId?: string // Optional specific user to notify, otherwise notifies all admins
) {
  try {
    const organization = await getOrganization(organizationId);
    if (!organization) {
      console.error('Organization not found for form submission notification');
      return { success: false, error: 'Organization not found' };
    }
    
    // Determine who should be notified
    let usersToNotify: UserData[] = [];
    
    if (notifyUserId) {
      // Notify a specific user
      const userDoc = await getDoc(doc(db, 'users', notifyUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<UserData, 'id'>;
        usersToNotify = [{
          id: userDoc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
          lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate() : new Date()
        }];
      }
    } else {
      // Notify all admins
      usersToNotify = await getOrganizationAdmins(organizationId);
    }
    
    if (usersToNotify.length === 0) {
      console.error('No users found to notify about form submission');
      return { success: false, error: 'No users found to notify' };
    }
    
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/forms/${formData.formId}`;
    
    // Prepare email template
    const emailPromises = usersToNotify.map(async user => {
      // Check if this user has form submission notifications enabled
      const isEnabled = await isNotificationEnabled(user.id, organizationId, 'newFormSubmissions');
      if (!isEnabled) return null;
      
      const { subject, html } = EmailTemplates.formSubmissionTemplate({
        formType: formData.formType,
        submittedBy: formData.submittedBy,
        submittedAt: formData.submittedAt,
        formId: formData.formId,
        dashboardUrl,
        userName: user.firstName || user.email.split('@')[0],
        organization
      });
      
      // Send email
      const result = await sendEmail({
        to: user.email,
        subject,
        html
      });
      
      // Log the notification
      await logNotification(
        organizationId,
        user.id,
        'formSubmission',
        'email',
        result.success,
        {
          formId: formData.formId,
          subject
        }
      );
      
      return result;
    });
    
    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r && r.success).length;
    
    return {
      success: successCount > 0,
      data: {
        totalUsers: usersToNotify.length,
        notifiedUsers: successCount
      }
    };
  } catch (error) {
    console.error('Error sending form submission notification:', error);
    return { success: false, error };
  }
}

// Notify about submission approval/rejection
export async function notifySubmissionApproval(
  organizationId: string,
  formData: {
    formId: string;
    formType: string;
    submittedBy: string;
    submittedAt: Date;
    status: 'waiting' | 'approved' | 'rejected';
  },
  notifyUserIds: string[] // Specific users to notify
) {
  try {
    const organization = await getOrganization(organizationId);
    if (!organization) {
      console.error('Organization not found for submission approval notification');
      return { success: false, error: 'Organization not found' };
    }
    
    // Get all users to notify
    const usersToNotify: UserData[] = [];
    
    for (const userId of notifyUserIds) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<UserData, 'id'>;
        usersToNotify.push({
          id: userDoc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
          lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate() : new Date()
        });
      }
    }
    
    if (usersToNotify.length === 0) {
      console.error('No users found to notify about submission approval');
      return { success: false, error: 'No users found to notify' };
    }
    
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/forms/${formData.formId}`;
    
    // Prepare email template
    const emailPromises = usersToNotify.map(async user => {
      // Check if this user has submission approval notifications enabled
      const isEnabled = await isNotificationEnabled(user.id, organizationId, 'submissionApprovals');
      if (!isEnabled) return null;
      
      const { subject, html } = EmailTemplates.submissionApprovalTemplate({
        formType: formData.formType,
        submittedBy: formData.submittedBy,
        submittedAt: formData.submittedAt,
        formId: formData.formId,
        dashboardUrl,
        userName: user.firstName || user.email.split('@')[0],
        organization,
        status: formData.status
      });
      
      // Send email
      const result = await sendEmail({
        to: user.email,
        subject,
        html
      });
      
      // Log the notification
      await logNotification(
        organizationId,
        user.id,
        'submissionApproval',
        'email',
        result.success,
        {
          formId: formData.formId,
          status: formData.status,
          subject
        }
      );
      
      return result;
    });
    
    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r && r.success).length;
    
    return {
      success: successCount > 0,
      data: {
        totalUsers: usersToNotify.length,
        notifiedUsers: successCount
      }
    };
  } catch (error) {
    console.error('Error sending submission approval notification:', error);
    return { success: false, error };
  }
}

// Notify about system updates
export async function notifySystemUpdate(
  organizationId: string,
  updateData: {
    updateTitle: string;
    updateDescription: string;
    updateType: string;
    maintenanceTime?: Date;
  }
) {
  try {
    const organization = await getOrganization(organizationId);
    if (!organization) {
      console.error('Organization not found for system update notification');
      return { success: false, error: 'Organization not found' };
    }
    
    // Get all users in the organization
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    const users: UserData[] = [];
    
    querySnapshot.forEach(doc => {
      const userData = doc.data() as Omit<UserData, 'id'>;
      users.push({
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
        lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate() : new Date()
      });
    });
    
    if (users.length === 0) {
      console.error('No users found for system update notification');
      return { success: false, error: 'No users found' };
    }
    
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    
    // Prepare email template
    const emailPromises = users.map(async user => {
      // Check if this user has system update notifications enabled
      const isEnabled = await isNotificationEnabled(user.id, organizationId, 'systemUpdates');
      if (!isEnabled) return null;
      
      const { subject, html } = EmailTemplates.systemUpdateTemplate({
        updateTitle: updateData.updateTitle,
        updateDescription: updateData.updateDescription,
        updateType: updateData.updateType,
        maintenanceTime: updateData.maintenanceTime,
        dashboardUrl,
        userName: user.firstName || user.email.split('@')[0],
        organization
      });
      
      // Send email
      const result = await sendEmail({
        to: user.email,
        subject,
        html
      });
      
      // Log the notification
      await logNotification(
        organizationId,
        user.id,
        'systemUpdate',
        'email',
        result.success,
        {
          updateTitle: updateData.updateTitle,
          subject
        }
      );
      
      return result;
    });
    
    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r && r.success).length;
    
    return {
      success: successCount > 0,
      data: {
        totalUsers: users.length,
        notifiedUsers: successCount
      }
    };
  } catch (error) {
    console.error('Error sending system update notification:', error);
    return { success: false, error };
  }
}

// Send daily digest email
export async function sendDailyDigest(organizationId: string, date = new Date()) {
  try {
    const organization = await getOrganization(organizationId);
    if (!organization) {
      console.error('Organization not found for daily digest');
      return { success: false, error: 'Organization not found' };
    }
    
    // Get all activities for the day
    const activities = await getDayActivities(organizationId, date);
    
    // Get all users in the organization
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    const users: UserData[] = [];
    
    querySnapshot.forEach(doc => {
      const userData = doc.data() as Omit<UserData, 'id'>;
      users.push({
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
        lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate() : new Date()
      });
    });
    
    if (users.length === 0) {
      console.error('No users found for daily digest');
      return { success: false, error: 'No users found' };
    }
    
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    
    // Prepare email template
    const emailPromises = users.map(async user => {
      // Check if this user has daily digest notifications enabled
      const isEnabled = await isNotificationEnabled(user.id, organizationId, 'dailyDigest');
      if (!isEnabled) return null;
      
      const { subject, html } = EmailTemplates.dailyDigestTemplate({
        activities,
        date,
        dashboardUrl,
        userName: user.firstName || user.email.split('@')[0],
        organization
      });
      
      // Send email
      const result = await sendEmail({
        to: user.email,
        subject,
        html
      });
      
      // Log the notification
      await logNotification(
        organizationId,
        user.id,
        'dailyDigest',
        'email',
        result.success,
        {
          date: date.toISOString(),
          activitiesCount: activities.length,
          subject
        }
      );
      
      return result;
    });
    
    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r && r.success).length;
    
    return {
      success: successCount > 0,
      data: {
        totalUsers: users.length,
        notifiedUsers: successCount,
        activitiesCount: activities.length
      }
    };
  } catch (error) {
    console.error('Error sending daily digest:', error);
    return { success: false, error };
  }
}

// Helper to get all activities for a specific day
async function getDayActivities(organizationId: string, date: Date) {
  // Set time to beginning of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Set time to end of day
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  try {
    // Get form submissions
    const formSubmissionsQuery = query(
      collection(db, 'organizations', organizationId, 'formSubmissions'),
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    
    const formSubmissionsSnapshot = await getDocs(formSubmissionsQuery);
    const formSubmissions = formSubmissionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        type: 'Form Submission',
        description: `${data.formType} submitted by ${data.submittedBy}`,
        time: data.createdAt.toDate(),
        url: `/dashboard/forms/${doc.id}`
      };
    });
    
    // Get incidents
    const incidentsQuery = query(
      collection(db, 'organizations', organizationId, 'incidents'),
      where('reportedAt', '>=', startOfDay),
      where('reportedAt', '<=', endOfDay)
    );
    
    const incidentsSnapshot = await getDocs(incidentsQuery);
    const incidents = incidentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        type: 'Incident',
        description: `${data.title} (${data.severity})`,
        time: data.reportedAt.toDate(),
        url: `/dashboard/incidents/${doc.id}`
      };
    });
    
    // Get notifications
    const notificationsQuery = query(
      collection(db, 'organizations', organizationId, 'notifications'),
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications = notificationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        type: 'Notification',
        description: `${data.notificationType} sent via ${data.sentVia}`,
        time: data.createdAt.toDate()
      };
    });
    
    // Combine all activities and sort by time
    const allActivities = [
      ...formSubmissions,
      ...incidents,
      ...notifications
    ].sort((a, b) => b.time.getTime() - a.time.getTime()); // Sort by time descending
    
    return allActivities;
  } catch (error) {
    console.error('Error getting day activities:', error);
    return [];
  }
} 