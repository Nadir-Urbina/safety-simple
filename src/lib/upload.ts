import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Firebase Storage
 * @param file The file to upload
 * @param path The path where the file will be stored
 * @returns The download URL of the uploaded file
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    // Generate a unique filename to avoid collisions
    const filename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fullPath = `${path}/${filename}`;
    
    // Create a storage reference
    const storageRef = ref(storage, fullPath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Uploads multiple files to Firebase Storage
 * @param files Array of files to upload
 * @param path The path where the files will be stored
 * @returns Array of download URLs for the uploaded files
 */
export async function uploadMultipleFiles(files: File[], path: string): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadFile(file, path));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw new Error('Failed to upload one or more files');
  }
}

/**
 * Extracts the file extension from a file name
 * @param filename The file name
 * @returns The file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Checks if a file is an image
 * @param file The file to check
 * @returns Whether the file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Creates a consistent path for storing form submission attachments
 * @param organizationId The organization ID
 * @param formId The form ID 
 * @param submissionId The submission ID
 * @returns The storage path
 */
export function getFormSubmissionAttachmentPath(
  organizationId: string,
  formId: string,
  submissionId: string
): string {
  return `organizations/${organizationId}/forms/${formId}/submissions/${submissionId}/attachments`;
} 