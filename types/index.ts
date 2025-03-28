// Organization types
export interface OrganizationSettings {
  allowSelfRegistration: boolean
  requireApprovalForSubmissions: boolean
  allowedDomains?: string[]
  logoURL?: string
  primaryColor?: string
  secondaryColor?: string
}

export interface Organization {
  id: string
  name: string
  createdAt: Date
  settings: OrganizationSettings
  license: {
    plan: "starter" | "professional" | "enterprise"
    seatsTotal: number
    seatsUsed: number
    expiresAt: Date
  }
}

// User types
export interface UserData {
  id: string
  displayName: string
  email: string
  photoURL?: string
  role: UserRole
  organizationId: string  // Link to organization
  department?: string
  jobTitle?: string
  createdAt: Date
  lastLogin: Date
}

export type UserRole = "admin" | "analyst" | "user"

// Incident types
export type IncidentType = "injury-illness" | "vehicle-accident" | "environmental-spill"

export interface IncidentBase {
  id: string
  type: IncidentType
  reportedBy: string
  reportedAt: Date
  location: string
  description: string
  jobNumber?: string
  supervisor?: string
  city?: string
  state?: string
  status: "new" | "in-progress" | "resolved" | "closed"
  severity: "minor" | "moderate" | "major" | "critical"
  images?: string[]
}

export interface InjuryIllnessIncident extends IncidentBase {
  type: "injury-illness"
  injuredPerson?: string
  injuryType?: string
  bodyPartAffected?: string
  treatmentProvided?: string
  hospitalized?: boolean
}

export interface VehicleAccidentIncident extends IncidentBase {
  type: "vehicle-accident"
  driverName?: string
  vehicleMakeModel?: string
  vin?: string
  damageDescription?: string
  thirdPartyInvolved?: boolean
  policeReportFiled?: boolean
  policeReportNumber?: string
}

export interface EnvironmentalSpillIncident extends IncidentBase {
  type: "environmental-spill"
  materialSpilled?: string
  quantity?: string
  containmentMeasures?: string
  reportedToAuthorities?: boolean
}

export type Incident = InjuryIllnessIncident | VehicleAccidentIncident | EnvironmentalSpillIncident

// Heat Illness Prevention types
export interface WeatherData {
  temperature: number
  heatIndex: number
  uvIndex: number
  conditions: string
  location: string
  timestamp: Date
}

export interface HeatJSAReport {
  id: string
  reportedBy: string
  reportedAt: Date
  jobNumber?: string
  location: string
  weatherData: WeatherData
  precautionsTaken: string[]
  additionalNotes?: string
  status: "submitted" | "reviewed" | "approved"
}

// Employee Recognition types
export type RecognitionType = "hazard-recognition" | "near-miss" | "job-safety-observation" | "good-catch"

export interface EmployeeRecognition {
  id: string
  type: RecognitionType
  reportedBy: string
  reportedAt: Date
  location: string
  description: string
  jobNumber?: string
  recognizedEmployee?: string
  severity?: "minor" | "moderate" | "major" | "critical"
  potentialOutcome?: string
  preventiveMeasures?: string
  images?: string[]
  status: "new" | "reviewed" | "acknowledged"
}

// Notification settings types
export interface NotificationSettings {
  email: {
    enabled: boolean;
    criticalIncidents: boolean;
    newFormSubmissions: boolean;
    submissionApprovals: boolean;
    systemUpdates: boolean;
    dailyDigest: boolean;
  };
  sms: {
    enabled: boolean;
    criticalIncidents: boolean;
    submissionApprovals: boolean;
    phoneNumber?: string;
  };
  reports: {
    enabled: boolean;
    dailyDigest: boolean;
    weeklyDigest: boolean;
    monthlyReport: boolean;
    scheduleTime: string;
    scheduleDay: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    recipients?: string;
  };
}

