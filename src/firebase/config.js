// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, collection, doc, getDoc, setDoc, updateDoc, getDocs, addDoc, deleteDoc, collection as fsCollection } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDr1U08ZXQYy2aZbFJugHbplNDDVQlhvGA",
  authDomain: "my-crd-53479.firebaseapp.com",
  projectId: "my-crd-53479",
  storageBucket: "my-crd-53479.firebasestorage.app",
  messagingSenderId: "904372944777",
  appId: "1:904372944777:web:c2c1bd341c763e856dab58",
  measurementId: "G-JLLDM9VQNX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = getAnalytics(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const database = getFirestore(app);
export const db = database;

// Firestore collection path helpers
const BASE_PATH = 'mainData/Billuload';

export const getCollectionRef = (collectionName) => {
  return collection(database, BASE_PATH, collectionName);
};

export const getDocRef = (collectionName, docId) => {
  return doc(database, BASE_PATH, collectionName, docId);
};

// Enable offline persistence
enableIndexedDbPersistence(database).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});

// Handle offline/online status
let isOnline = navigator.onLine;

const handleOnline = () => {
  console.log('Internet connection restored');
  isOnline = true;
};

const handleOffline = () => {
  console.log('Internet connection lost - Firestore will work offline');
  isOnline = false;
};

window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

export const getConnectionStatus = () => isOnline;

// -------------------------------------------------------
// 🔰 Super Admin Role Management Helpers (New Additions)
// -------------------------------------------------------

/**
 * Save user role in Firestore (superadmin, admin, user)
 */
export const setUserRole = async (uid, role) => {
  try {
    const userRef = getDocRef('users', uid);
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      await updateDoc(userRef, { role });
    } else {
      await setDoc(userRef, { role });
    }
    console.log(`✅ Role set to "${role}" for UID: ${uid}`);
  } catch (err) {
    console.error('❌ Error setting user role:', err);
  }
};

/**
 * Fetch user role from Firestore
 */
export const getUserRole = async (uid) => {
  try {
    const userRef = getDocRef('users', uid);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data().role : null;
  } catch (err) {
    console.error('❌ Error fetching user role:', err);
    return null;
  }
};

/**
 * Get all admins from Firestore
 */
export const getAllAdmins = async () => {
  try {
    const usersCol = fsCollection(database, BASE_PATH, 'users');
    const querySnapshot = await getDocs(usersCol);
    const admins = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.role === 'admin') admins.push({ id: docSnap.id, ...data });
    });
    return admins;
  } catch (err) {
    console.error('❌ Error fetching admins:', err);
    return [];
  }
};

/**
 * Add a new admin (by Super Admin)
 */
export const addAdmin = async (adminData) => {
  try {
    const usersCol = fsCollection(database, BASE_PATH, 'users');
    await addDoc(usersCol, adminData);
    console.log('✅ New admin added successfully');
  } catch (err) {
    console.error('❌ Error adding admin:', err);
  }
};

/**
 * Delete admin account (by Super Admin)
 */
export const deleteAdmin = async (adminId) => {
  try {
    const adminRef = getDocRef('users', adminId);
    await deleteDoc(adminRef);
    console.log('✅ Admin deleted successfully');
  } catch (err) {
    console.error('❌ Error deleting admin:', err);
  }
};

// -------------------------------------------------------

export default app;
