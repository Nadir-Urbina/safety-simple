import { FormTemplate, FormSubmission } from '@/types/forms';
import { processFirestoreData, getUserId, toDate } from './firebase-utils';
import { User } from 'firebase/auth';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Gets a form template by ID with proper timestamp handling
 */
export async function getFormTemplate(
  organizationId: string, 
  templateId: string
): Promise<FormTemplate | null> {
  try {
    if (!organizationId || !templateId) {
      console.error("Missing required IDs", { organizationId, templateId });
      return null;
    }
    
    const formRef = doc(db, "organizations", organizationId, "formTemplates", templateId);
    const formDoc = await getDoc(formRef);
    
    if (!formDoc.exists()) {
      console.warn(`Form template not found: ${templateId}`);
      return null;
    }
    
    const data = formDoc.data();
    const processedData = processFirestoreData(data);
    
    return {
      id: formDoc.id,
      ...processedData
    } as FormTemplate;
  } catch (error) {
    console.error("Error fetching form template:", error);
    return null;
  }
}

/**
 * Gets form templates for the organization with proper timestamp handling
 */
export async function getFormTemplates(
  organizationId: string
): Promise<FormTemplate[]> {
  try {
    if (!organizationId) {
      console.error("Missing organization ID");
      return [];
    }
    
    const formTemplatesQuery = query(
      collection(db, "organizations", organizationId, "formTemplates")
    );
    
    const formTemplatesSnapshot = await getDocs(formTemplatesQuery);
    const templates: FormTemplate[] = [];
    
    formTemplatesSnapshot.forEach((doc) => {
      const data = doc.data();
      const processedData = processFirestoreData(data);
      
      templates.push({
        id: doc.id,
        ...processedData
      } as FormTemplate);
    });
    
    return templates;
  } catch (error) {
    console.error("Error fetching form templates:", error);
    return [];
  }
}

/**
 * Gets a form submission by ID
 */
export async function getFormSubmission(
  organizationId: string,
  submissionId: string
): Promise<FormSubmission | null> {
  try {
    if (!organizationId || !submissionId) {
      console.error("Missing required IDs", { organizationId, submissionId });
      return null;
    }
    
    const submissionRef = doc(db, "organizations", organizationId, "formSubmissions", submissionId);
    const submissionDoc = await getDoc(submissionRef);
    
    if (!submissionDoc.exists()) {
      console.warn(`Form submission not found: ${submissionId}`);
      return null;
    }
    
    const data = submissionDoc.data();
    const processedData = processFirestoreData(data);
    
    return {
      id: submissionDoc.id,
      ...processedData
    } as FormSubmission;
  } catch (error) {
    console.error("Error fetching form submission:", error);
    return null;
  }
}

/**
 * Gets form submissions for the organization
 */
export async function getFormSubmissions(
  organizationId: string
): Promise<FormSubmission[]> {
  try {
    if (!organizationId) {
      console.error("Missing organization ID");
      return [];
    }
    
    const submissionsQuery = query(
      collection(db, "organizations", organizationId, "formSubmissions")
    );
    
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissions: FormSubmission[] = [];
    
    submissionsSnapshot.forEach((doc) => {
      const data = doc.data();
      const processedData = processFirestoreData(data);
      
      submissions.push({
        id: doc.id,
        ...processedData
      } as FormSubmission);
    });
    
    return submissions;
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    return [];
  }
}

/**
 * Safely get user ID even if user is undefined
 */
export function getSubmitterUserId(user: User | null | undefined): string {
  if (!user) {
    console.warn("User is null or undefined when getting submitter ID");
    return "unknown";
  }
  
  return getUserId(user) || user.uid || "unknown";
} 