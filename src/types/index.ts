// Add the following to the types file:

// Heat prevention settings
export interface HeatThreshold {
  id: string;
  name: string;
  minHeatIndex: number;
  maxHeatIndex?: number;
  color: string;
  precautions: string[];
}

export interface HeatPreventionSettings {
  thresholds: HeatThreshold[];
  weatherApiKey?: string;
  updatedAt: Date;
}

// Weather data
export interface WeatherData {
  temperature: number;
  humidity: number;
  heatIndex: number;
  predictedMaxHeatIndex?: number | null;
  uvIndex: number;
  conditions: string;
  location: string;
  timestamp: Date;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface HeatComplianceRecord {
  id: string;
  organizationId: string;
  submittedBy: string;
  submittedByName: string;
  jobNumber: string;
  location: string;
  weatherData: WeatherData;
  heatIndex: number;
  predictedMaxHeatIndex?: number | null;
  highestHeatIndex: number;
  riskLevel: string;
  precautionsRequired: string[];
  precautionsTaken: string[];
  additionalNotes?: string;
  status: 'submitted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// UnifiedSubmission type for the consolidated submissions view
export interface UnifiedSubmission {
  id: string;
  type: 'form' | 'heatCompliance';
  formId?: string;       // Only for form submissions (formTemplateId)
  formName?: string;     // Display name of the form or "Heat JSA"
  organizationId: string;
  submittedBy: string;   // User ID
  submittedByName?: string; // Display name if available
  submittedAt: Date;     // Using submittedAt for forms, createdAt for heat records
  status: string;        // Unified status field
  category?: string;     // Category for filtering
  
  // Original data
  originalFormSubmission?: any; // Original FormSubmission object
  originalHeatRecord?: any;     // Original HeatComplianceRecord object
}

// Re-export all the types from the various type files
export * from './forms';
export * from './organization';
export * from './weather';
export * from './notifications'; 