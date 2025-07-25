import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSDtdlxpLThQ0NZq-r8O6g6cVqVrtYDBU",
  authDomain: "bandwith-41c0a.firebaseapp.com",
  projectId: "bandwith-41c0a",
  storageBucket: "bandwith-41c0a.firebasestorage.app",
  messagingSenderId: "21824344608",
  appId: "1:21824344608:web:931de49de100d1f0ef2245",
  measurementId: "G-Y9ME17HHSZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); 