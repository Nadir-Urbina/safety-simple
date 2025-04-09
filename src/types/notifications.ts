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