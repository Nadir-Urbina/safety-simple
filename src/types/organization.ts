// Organization types
export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  requireApprovalForSubmissions: boolean;
  allowedDomains?: string[];
  logoURL?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  settings: OrganizationSettings;
  license: {
    plan: "starter" | "professional" | "enterprise";
    seatsTotal: number;
    seatsUsed: number;
    expiresAt: Date;
  };
}

// User types related to organizations
export interface UserData {
  id: string;
  uid?: string;  // For compatibility with Firebase Auth
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photoURL?: string | null;
  role: UserRole;
  organizationId: string;  // Link to organization
  department?: string;
  jobTitle?: string;
  bio?: string;
  phoneNumber?: string;
  createdAt: Date;
  lastLogin: Date;
  notifications?: {
    disableAll?: boolean;
    email?: boolean;
    sms?: boolean;
    app?: boolean;
  };
}

export type UserRole = "admin" | "analyst" | "user"; 