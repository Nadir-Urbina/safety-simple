// System Form Templates Seeding Script
// This script is meant to be run in the browser or as part of the app

import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// Template definitions
const templates = [
  // 1. Incident Report Template (Basic)
  {
    id: "incident-report-basic",
    name: "Basic Incident Report",
    description: "A simple form for reporting workplace accidents, near misses, and safety incidents",
    category: "incident",
    createdAt: new Date(),
    updatedAt: new Date(),
    industries: ["general", "construction", "manufacturing", "transportation"],
    complexity: "basic",
    estimatedCompletionTime: 5,
    usageCount: 0,
    version: 1,
    isLatestVersion: true,
    fields: [
      {
        id: uuidv4(),
        type: "text",
        label: "Incident Title",
        name: "incident_title",
        placeholder: "Brief description of the incident",
        helpText: "Provide a short title describing what happened",
        required: true,
        order: 1
      },
      {
        id: uuidv4(),
        type: "date",
        label: "Date of Incident",
        name: "incident_date",
        required: true,
        order: 2
      },
      {
        id: uuidv4(),
        type: "select",
        label: "Incident Type",
        name: "incident_type",
        required: true,
        order: 3,
        options: [
          { label: "Injury", value: "injury" },
          { label: "Near Miss", value: "near_miss" },
          { label: "Property Damage", value: "property_damage" },
          { label: "Environmental", value: "environmental" },
          { label: "Other", value: "other" }
        ]
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Incident Description",
        name: "incident_description",
        placeholder: "Describe what happened",
        helpText: "Provide details about what happened, who was involved, and the circumstances",
        required: true,
        order: 4
      },
      {
        id: uuidv4(),
        type: "text",
        label: "Location",
        name: "location",
        placeholder: "Where did the incident occur?",
        required: true,
        order: 5
      },
      {
        id: uuidv4(),
        type: "checkbox",
        label: "Medical Attention Required",
        name: "medical_attention",
        required: false,
        order: 6
      },
      {
        id: uuidv4(),
        type: "file",
        label: "Photos or Documents",
        name: "attachments",
        helpText: "Attach any relevant photos or documents (optional)",
        required: false,
        order: 7
      }
    ]
  },
  
  // 2. Comprehensive Incident Investigation
  {
    id: "incident-investigation-advanced",
    name: "Comprehensive Incident Investigation",
    description: "Detailed incident investigation form with root cause analysis and corrective actions",
    category: "incident",
    createdAt: new Date(),
    updatedAt: new Date(),
    industries: ["construction", "manufacturing", "oil_and_gas", "utilities"],
    complexity: "advanced",
    estimatedCompletionTime: 20,
    usageCount: 0,
    version: 1,
    isLatestVersion: true,
    fields: [
      {
        id: uuidv4(),
        type: "text",
        label: "Incident Title",
        name: "incident_title",
        required: true,
        order: 1
      },
      {
        id: uuidv4(),
        type: "date",
        label: "Date of Incident",
        name: "incident_date",
        required: true,
        order: 2
      },
      {
        id: uuidv4(),
        type: "date",
        label: "Date of Investigation",
        name: "investigation_date",
        required: true,
        order: 3
      },
      {
        id: uuidv4(),
        type: "text",
        label: "Location",
        name: "location",
        required: true,
        order: 4
      },
      {
        id: uuidv4(),
        type: "select",
        label: "Severity Level",
        name: "severity",
        required: true,
        order: 5,
        options: [
          { label: "Minor", value: "minor" },
          { label: "Moderate", value: "moderate" },
          { label: "Serious", value: "serious" },
          { label: "Critical", value: "critical" },
          { label: "Catastrophic", value: "catastrophic" }
        ]
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Incident Description",
        name: "incident_description",
        required: true,
        order: 6
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Immediate Actions Taken",
        name: "immediate_actions",
        helpText: "Describe any immediate actions taken to address the incident",
        required: true,
        order: 7
      },
      {
        id: uuidv4(),
        type: "multiselect",
        label: "Contributing Factors",
        name: "contributing_factors",
        required: true,
        order: 8,
        options: [
          { label: "Human Error", value: "human_error" },
          { label: "Equipment Failure", value: "equipment_failure" },
          { label: "Environmental Conditions", value: "environmental" },
          { label: "Procedural Issues", value: "procedural" },
          { label: "Training Deficiency", value: "training" },
          { label: "Design Flaw", value: "design" },
          { label: "Maintenance Issue", value: "maintenance" },
          { label: "Communication Breakdown", value: "communication" },
          { label: "Management System Failure", value: "management" },
          { label: "Other", value: "other" }
        ]
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Root Cause Analysis",
        name: "root_cause",
        helpText: "Identify the underlying root causes that led to the incident",
        required: true,
        order: 9
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Corrective Actions",
        name: "corrective_actions",
        helpText: "Describe actions to prevent recurrence",
        required: true,
        order: 10
      },
      {
        id: uuidv4(),
        type: "text",
        label: "Person Responsible",
        name: "responsible_person",
        helpText: "Who is responsible for implementing corrective actions",
        required: true,
        order: 11
      },
      {
        id: uuidv4(),
        type: "date",
        label: "Target Completion Date",
        name: "target_date",
        required: true,
        order: 12
      },
      {
        id: uuidv4(),
        type: "file",
        label: "Supporting Documents",
        name: "attachments",
        helpText: "Attach photos, diagrams, or other relevant documentation",
        required: false,
        order: 13
      }
    ]
  },
  
  // 3. Heat Stress Prevention Checklist
  {
    id: "heat-stress-prevention",
    name: "Heat Stress Prevention Checklist",
    description: "Checklist for preventing heat-related illness in hot work environments",
    category: "heatPrevention",
    createdAt: new Date(),
    updatedAt: new Date(),
    industries: ["construction", "agriculture", "utilities", "oil_and_gas"],
    complexity: "intermediate",
    estimatedCompletionTime: 10,
    usageCount: 0,
    version: 1,
    isLatestVersion: true,
    fields: [
      {
        id: uuidv4(),
        type: "text",
        label: "Project/Site Name",
        name: "project_name",
        required: true,
        order: 1
      },
      {
        id: uuidv4(),
        type: "date",
        label: "Date",
        name: "assessment_date",
        required: true,
        order: 2
      },
      {
        id: uuidv4(),
        type: "number",
        label: "Current Temperature (°F)",
        name: "temperature",
        required: true,
        order: 3
      },
      {
        id: uuidv4(),
        type: "number",
        label: "Humidity (%)",
        name: "humidity",
        required: true,
        order: 4
      },
      {
        id: uuidv4(),
        type: "select",
        label: "Heat Index Risk Level",
        name: "risk_level",
        required: true,
        order: 5,
        options: [
          { label: "Low (< 91°F)", value: "low" },
          { label: "Moderate (91°F - 103°F)", value: "moderate" },
          { label: "High (103°F - 115°F)", value: "high" },
          { label: "Extreme (> 115°F)", value: "extreme" }
        ]
      },
      {
        id: uuidv4(),
        type: "multiselect",
        label: "Work Factors Present",
        name: "work_factors",
        required: true,
        order: 6,
        options: [
          { label: "Direct Sun Exposure", value: "sun_exposure" },
          { label: "Heavy Physical Exertion", value: "heavy_exertion" },
          { label: "Wearing PPE That Traps Heat", value: "ppe" },
          { label: "Hot Equipment/Machinery", value: "hot_equipment" },
          { label: "Limited Air Movement", value: "limited_air" },
          { label: "Working Near Reflective Surfaces", value: "reflective_surfaces" }
        ]
      },
      {
        id: uuidv4(),
        type: "multiselect",
        label: "Controls Implemented",
        name: "controls",
        required: true,
        order: 7,
        options: [
          { label: "Scheduled Rest Breaks in Shade", value: "rest_breaks" },
          { label: "Cold Water Readily Available", value: "water" },
          { label: "Cooling Stations/Area", value: "cooling_stations" },
          { label: "Work Rescheduled to Cooler Hours", value: "reschedule" },
          { label: "Job Rotation", value: "job_rotation" },
          { label: "Buddy System", value: "buddy_system" },
          { label: "Acclimatization Protocol", value: "acclimatization" },
          { label: "Misting Fans/Cooling Methods", value: "misting_fans" }
        ]
      },
      {
        id: uuidv4(),
        type: "checkbox",
        label: "Workers Trained on Heat Illness Recognition and Prevention",
        name: "worker_training",
        required: true,
        order: 8
      },
      {
        id: uuidv4(),
        type: "checkbox",
        label: "Emergency Response Plan Ready",
        name: "emergency_plan",
        required: true,
        order: 9
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Additional Measures/Comments",
        name: "additional_measures",
        required: false,
        order: 10
      }
    ]
  },
  
  // 4. Safety Observation Card
  {
    id: "safety-observation",
    name: "Safety Observation Card",
    description: "Simple form for reporting unsafe conditions and positive safety behaviors",
    category: "recognition",
    createdAt: new Date(),
    updatedAt: new Date(),
    industries: ["general", "construction", "manufacturing", "healthcare"],
    complexity: "basic",
    estimatedCompletionTime: 3,
    usageCount: 0,
    version: 1,
    isLatestVersion: true,
    fields: [
      {
        id: uuidv4(),
        type: "date",
        label: "Observation Date",
        name: "observation_date",
        required: true,
        order: 1
      },
      {
        id: uuidv4(),
        type: "text",
        label: "Location",
        name: "location",
        required: true,
        order: 2
      },
      {
        id: uuidv4(),
        type: "select",
        label: "Observation Type",
        name: "observation_type",
        required: true,
        order: 3,
        options: [
          { label: "Safe Behavior/Condition", value: "safe" },
          { label: "Unsafe Behavior/Condition", value: "unsafe" }
        ]
      },
      {
        id: uuidv4(),
        type: "select",
        label: "Category",
        name: "category",
        required: true,
        order: 4,
        options: [
          { label: "Personal Protective Equipment", value: "ppe" },
          { label: "Tools & Equipment", value: "tools" },
          { label: "Housekeeping", value: "housekeeping" },
          { label: "Ergonomics", value: "ergonomics" },
          { label: "Fall Protection", value: "fall_protection" },
          { label: "Material Handling", value: "material_handling" },
          { label: "Procedures/Rules", value: "procedures" },
          { label: "Other", value: "other" }
        ]
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Description",
        name: "description",
        placeholder: "Describe what you observed",
        required: true,
        order: 5
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Action Taken",
        name: "action_taken",
        placeholder: "Describe any immediate action taken or feedback provided",
        required: false,
        order: 6
      },
      {
        id: uuidv4(),
        type: "file",
        label: "Photo (if applicable)",
        name: "photo",
        required: false,
        order: 7
      }
    ]
  },
  
  // 5. Job Safety Analysis (JSA)
  {
    id: "job-safety-analysis",
    name: "Job Safety Analysis (JSA)",
    description: "Form for analyzing steps of a job and identifying potential hazards and controls",
    category: "other",
    createdAt: new Date(),
    updatedAt: new Date(),
    industries: ["construction", "manufacturing", "utilities", "oil_and_gas"],
    complexity: "intermediate",
    estimatedCompletionTime: 15,
    usageCount: 0,
    version: 1,
    isLatestVersion: true,
    fields: [
      {
        id: uuidv4(),
        type: "text",
        label: "Job/Task Name",
        name: "job_name",
        required: true,
        order: 1
      },
      {
        id: uuidv4(),
        type: "date",
        label: "Date",
        name: "jsa_date",
        required: true,
        order: 2
      },
      {
        id: uuidv4(),
        type: "text",
        label: "Department/Area",
        name: "department",
        required: true,
        order: 3
      },
      {
        id: uuidv4(),
        type: "text",
        label: "Conducted By",
        name: "conducted_by",
        required: true,
        order: 4
      },
      {
        id: uuidv4(),
        type: "multiselect",
        label: "Required PPE",
        name: "required_ppe",
        required: true,
        order: 5,
        options: [
          { label: "Hard Hat", value: "hard_hat" },
          { label: "Safety Glasses", value: "safety_glasses" },
          { label: "Safety Footwear", value: "safety_footwear" },
          { label: "Hearing Protection", value: "hearing_protection" },
          { label: "Gloves", value: "gloves" },
          { label: "Respiratory Protection", value: "respiratory" },
          { label: "Fall Protection", value: "fall_protection" },
          { label: "High-Visibility Clothing", value: "high_vis" },
          { label: "Face Shield", value: "face_shield" },
          { label: "Other", value: "other_ppe" }
        ]
      },
      {
        id: uuidv4(),
        type: "multiselect",
        label: "Required Tools/Equipment",
        name: "tools_equipment",
        required: false,
        order: 6,
        options: [
          { label: "Hand Tools", value: "hand_tools" },
          { label: "Power Tools", value: "power_tools" },
          { label: "Heavy Machinery", value: "heavy_machinery" },
          { label: "Ladders/Scaffolding", value: "ladders" },
          { label: "Lifting Equipment", value: "lifting_equipment" },
          { label: "Electrical Tools", value: "electrical_tools" },
          { label: "Welding Equipment", value: "welding" },
          { label: "Chemicals/Hazardous Materials", value: "chemicals" },
          { label: "Other", value: "other_tools" }
        ]
      },
      // Step 1
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 1: Job Step Description",
        name: "step1_description",
        helpText: "Break down the job into basic steps",
        required: true,
        order: 7
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 1: Potential Hazards",
        name: "step1_hazards",
        helpText: "What could go wrong or cause injury/illness?",
        required: true,
        order: 8
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 1: Control Measures",
        name: "step1_controls",
        helpText: "What should be done to reduce or eliminate the hazards?",
        required: true,
        order: 9
      },
      // Step 2
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 2: Job Step Description",
        name: "step2_description",
        required: false,
        order: 10
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 2: Potential Hazards",
        name: "step2_hazards",
        required: false,
        order: 11
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 2: Control Measures",
        name: "step2_controls",
        required: false,
        order: 12
      },
      // Step 3
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 3: Job Step Description",
        name: "step3_description",
        required: false,
        order: 13
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 3: Potential Hazards",
        name: "step3_hazards",
        required: false,
        order: 14
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Step 3: Control Measures",
        name: "step3_controls",
        required: false,
        order: 15
      },
      {
        id: uuidv4(),
        type: "textarea",
        label: "Additional Notes",
        name: "additional_notes",
        required: false,
        order: 16
      }
    ]
  }
];

// Function to seed templates
export async function seedSystemTemplates() {
  try {
    console.log('🌱 Starting template seeding...');
    let seededCount = 0;
    
    for (const template of templates) {
      const templateRef = doc(db, 'systemFormTemplates', template.id);
      
      // Check if template already exists
      const docSnap = await getDoc(templateRef);
      if (docSnap.exists()) {
        console.log(`Template '${template.name}' already exists, skipping...`);
        continue;
      }
      
      // Add template to Firestore
      await setDoc(templateRef, template);
      console.log(`✅ Template '${template.name}' added successfully!`);
      seededCount++;
    }
    
    console.log(`🎉 Templates seeded: ${seededCount}`);
    return seededCount;
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
} 