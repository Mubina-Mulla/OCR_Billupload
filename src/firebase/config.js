// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, goOffline, goOnline } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDr1U08ZXQYy2aZbFJugHbplNDDVQlhvGA",
  authDomain: "my-crd-53479.firebaseapp.com",
  databaseURL: "https://my-crd-53479-default-rtdb.firebaseio.com",
  projectId: "my-crd-53479",
  storageBucket: "my-crd-53479.firebasestorage.app",
  messagingSenderId: "904372944777",
  appId: "1:904372944777:web:c2c1bd341c763e856dab58",
  measurementId: "G-JLLDM9VQNX"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with error handling
export const auth = getAuth(app);

// Initialize Database with offline persistence
export const database = getDatabase(app);

// Handle offline/online status
let isOnline = navigator.onLine;

const handleOnline = () => {
  console.log('Internet connection restored');
  isOnline = true;
  try {
    goOnline(database);
  } catch (error) {
    console.log('Firebase already online or error:', error.message);
  }
};

const handleOffline = () => {
  console.log('Internet connection lost - Firebase will work offline');
  isOnline = false;
  try {
    goOffline(database);
  } catch (error) {
    console.log('Firebase already offline or error:', error.message);
  }
};

// Listen for online/offline events
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// Set initial state
if (!isOnline) {
  handleOffline();
}

// Export connection status
export const getConnectionStatus = () => isOnline;

// keep existing name
export const db = database;

export default app;