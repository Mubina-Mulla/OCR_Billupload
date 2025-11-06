// Utility to create test users for Firebase Authentication
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

/**
 * Create a test user for development
 * Call this function from browser console to create users
 */
export const createTestUser = async (email = 'admin@example.com', password = 'admin123') => {
  try {
    console.log('Creating test user:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Test user created successfully:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ User already exists, you can login with:', email);
    } else if (error.code === 'auth/weak-password') {
      console.log('⚠️ Password is too weak. Use at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('⚠️ Invalid email format.');
    }
    
    throw error;
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.createTestUser = createTestUser;
}
