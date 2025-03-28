import { doc, getDoc, setDoc, WithFieldValue, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define the settings categories
export type SettingsCategory = 
  | 'general'
  | 'workingHours'
  | 'branding'
  | 'notifications'
  | 'compliance'
  | 'dataManagement';

// General settings interface
export interface GeneralSettings {
  name: string;
  industry: string;
  size: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  website?: string;
  description?: string;
}

// Working hours settings interface
export interface WorkingHoursSettings {
  workDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  workHoursStart: string;
  workHoursEnd: string;
  timezone: string;
  enableAfterHoursAlerts: boolean;
}

// Branding settings interface
export interface BrandingSettings {
  logoURL: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

// Notification settings interface
export interface NotificationSettings {
  emailNotifications: {
    enabled: boolean;
    newSubmissions: boolean;
    submissionApprovals: boolean;
    criticalIncidents: boolean;
    systemUpdates: boolean;
    dailyDigest: boolean;
  };
  smsAlerts: {
    enabled: boolean;
    criticalIncidentsOnly: boolean;
    phoneNumber?: string;
  };
  reportScheduling: {
    enabled: boolean;
    frequency: string;
    dayOfWeek?: string;
    timeOfDay: string;
    recipients: string;
    includeAttachments: boolean;
    customMessage?: string;
  };
}

// Compliance settings interface
export interface ComplianceSettings {
  enableOSHACompliance: boolean;
  enableISO45001: boolean;
  enableCustomRegulations: boolean;
  autoExportReports: boolean;
  retentionPeriod: string;
  complianceManager: string;
  complianceNotes?: string;
  requiredSignatureForCritical: boolean;
  enableAuditTrail: boolean;
  enableVersionControl: boolean;
}

// Data management settings interface
export interface DataManagementSettings {
  autoBackup: boolean;
  backupFrequency: string;
  backupLocation: string;
  retentionPeriod: string;
  encryptBackups: boolean;
  compressionLevel: string;
  allowDataDeletion: boolean;
  backupReminders: boolean;
}

// Helper function to get a reference to a settings document
export function getSettingsDocRef(organizationId: string, category: SettingsCategory) {
  return doc(db, "organizations", organizationId, "settings", category);
}

// Function to fetch settings for a specific organization and category
export async function fetchSettings<T>(
  organizationId: string,
  category: SettingsCategory
): Promise<T | null> {
  try {
    const docRef = getSettingsDocRef(organizationId, category);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ${category} settings:`, error);
    throw error;
  }
}

// Function to save settings for a specific organization and category
export async function saveSettings<T extends WithFieldValue<DocumentData>>(
  organizationId: string,
  category: SettingsCategory,
  data: T
): Promise<void> {
  try {
    const docRef = getSettingsDocRef(organizationId, category);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Error saving ${category} settings:`, error);
    throw error;
  }
} 