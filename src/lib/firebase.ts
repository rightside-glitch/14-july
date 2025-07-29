import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBSDtdlxpLThQ0NZq-r8O6g6cVqVrtYDBU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bandwith-41c0a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bandwith-41c0a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bandwith-41c0a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "21824344608",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:21824344608:web:931de49de100d1f0ef2245",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Y9ME17HHSZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Add error handling for Firestore operations
export const handleFirestoreError = (error: any, operation: string) => {
  console.error(`Firestore ${operation} error:`, error);
  
  // Check for common Firebase errors
  if (error.code === 'permission-denied') {
    console.error('Firebase permission denied. Check security rules.');
  } else if (error.code === 'unavailable') {
    console.error('Firebase service unavailable. Check network connection.');
  } else if (error.code === 'unauthenticated') {
    console.error('User not authenticated.');
  }
  
  return error;
}; 