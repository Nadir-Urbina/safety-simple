/**
 * Generates a secure random password
 * @returns A random password with at least one uppercase, one lowercase, one number, and one special character
 */
export function generateSecurePassword(length = 10): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // removed I and O which can look like 1 and 0
  const lowercase = 'abcdefghijkmnpqrstuvwxyz'; // removed l which can look like 1
  const numbers = '23456789'; // removed 0 and 1 which can look like O and l
  const symbols = '!@#$%^&*()-_=+';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Ensure at least one of each type
  let password = 
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password characters
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
} 