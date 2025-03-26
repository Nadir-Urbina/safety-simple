// Form field types
export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'radio' 
  | 'file';

// Form categories
export type FormCategory = 
  | 'incident' 
  | 'recognition' 
  | 'heatPrevention' 
  | 'other';

// Form submission status
export type SubmissionStatus = 
  | 'draft' 
  | 'submitted' 
  | 'inReview'
  | 'approved'
  | 'rejected';

// Field option for selects, radios, etc.
export interface FieldOption {
  label: string;
  value: string;
  deprecated?: boolean; // For options we want to hide from new submissions but preserve in data
}

// Validation rules for fields
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'custom';
  value?: any;
  message?: string;
}

// Individual form field definition
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name?: string; // System-generated from label if not provided
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  options?: FieldOption[]; // For select, multiselect, radio
  validation?: ValidationRule[];
  defaultValue?: any;
  hidden?: boolean; // Fields can be hidden rather than deleted
  deprecated?: boolean; // For fields kept only for historical data
}

// Complete form template
export interface FormTemplate {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category: FormCategory;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  isActive: boolean;
  fields: FormField[];
  
  // Version control
  version: number;
  previousVersionId?: string;
  isLatestVersion: boolean;
}

// A submitted form instance
export interface FormSubmission {
  id: string;
  formTemplateId: string;
  formVersion: number; // The version of the form that was used
  organizationId: string;
  submittedBy: string; // User ID
  submittedAt: Date;
  lastUpdatedAt: Date;
  lastUpdatedBy?: string; // User ID
  status: SubmissionStatus;
  reviewedBy?: string; // User ID
  reviewedAt?: Date;
  reviewNotes?: string;
  values: {
    [fieldId: string]: any; // Maps to the field values
  };
  attachments?: string[]; // URLs to uploaded files
} 