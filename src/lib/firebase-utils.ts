import { Timestamp } from 'firebase/firestore';

/**
 * Type guard to check if a value is a Firestore Timestamp
 */
export function isFirestoreTimestamp(value: any): value is Timestamp {
  return value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function';
}

/**
 * Safely converts any timestamp-like value to a JavaScript Date
 * Works with Firestore Timestamps, Date objects, or ISO strings
 */
export function toDate(value: any): Date | null {
  if (!value) return null;
  
  // Handle Firestore timestamp objects
  if (isFirestoreTimestamp(value)) {
    return value.toDate();
  }
  
  // Already a Date object
  if (value instanceof Date) {
    return value;
  }
  
  // String ISO date
  if (typeof value === 'string') {
    try {
      return new Date(value);
    } catch (e) {
      console.error('Invalid date string:', value);
      return null;
    }
  }
  
  // Number (timestamp in ms)
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  // For backwards compatibility with code that checks for toDate method
  if (value && typeof value === 'object' && value.toDate === undefined) {
    // Add a toDate method to avoid errors when code tries to call it
    value.toDate = function() { 
      console.warn('toDate called on object that is not a Firestore timestamp:', value);
      return value instanceof Date ? value : new Date(); 
    };
  }
  
  return null;
}

/**
 * Process an object with potential Firestore timestamps and convert them to Dates
 * @param obj - Object that may contain Firestore timestamps
 * @returns New object with timestamps converted to Dates
 */
export function processFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (!obj) return obj;
  
  const result = { ...obj } as { [key: string]: any };
  
  // Common timestamp field names
  const timestampFields = ['createdAt', 'updatedAt', 'date', 'timestamp', 'lastLogin', 
    'submittedAt', 'reviewedAt', 'lastUpdatedAt', 'expiresAt'];
  
  for (const key of Object.keys(result)) {
    const value = result[key];
    
    // If it's a timestamp field or ends with 'At' or 'Date', try to convert it
    if (timestampFields.includes(key) || key.endsWith('At') || key.endsWith('Date')) {
      result[key] = toDate(value) || new Date();
    }
    
    // Recursively process nested objects
    if (value && typeof value === 'object' && !isFirestoreTimestamp(value) && !(value instanceof Date)) {
      // Skip arrays (we don't want to process array indices as keys)
      if (!Array.isArray(value)) {
        result[key] = processFirestoreData(value);
      } else if (Array.isArray(value)) {
        // For arrays, we need to map and process each item that might be an object
        result[key] = value.map(item => 
          item && typeof item === 'object' && !isFirestoreTimestamp(item) && !(item instanceof Date) 
            ? processFirestoreData(item) 
            : item
        );
      }
    }
  }
  
  return result as T;
}

/**
 * Get the user ID safely from user data
 * Handles both Firebase Auth user.uid and our UserData.id fields
 */
export function getUserId(user: any): string | null {
  if (!user) return null;
  
  // Check for our UserData.id first
  if (user.id) return user.id;
  
  // Then check for Firebase Auth uid
  if (user.uid) return user.uid;
  
  return null;
}

/**
 * A safer version of the map function that includes proper TypeScript typing
 * @param array The array to map over
 * @param callback The mapping function
 * @returns A new array with the mapped values
 */
export function safeMap<T, R>(array: T[] | undefined | null, callback: (item: T, index: number) => R): R[] {
  if (!array) return [];
  return array.map(callback);
}

/**
 * A safer version of the filter function that includes proper TypeScript typing
 * @param array The array to filter
 * @param predicate The predicate function
 * @returns A new filtered array
 */
export function safeFilter<T>(array: T[] | undefined | null, predicate: (item: T, index: number) => boolean): T[] {
  if (!array) return [];
  return array.filter(predicate);
} 