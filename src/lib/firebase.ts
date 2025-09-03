import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  // Replace these with your actual Firebase config values
  // You can find these in your Firebase Console > Project Settings > General > Your apps
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDng0XZ2M0sL4Pn6RvX2FNr1O038kAtZdE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fieldconnect-9a047.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fieldconnect-9a047",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fieldconnect-9a047.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "107287762543",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:107287762543:web:0945b2f543ffd16a55df9a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZBCWKT09W2"
};

console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set'
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics only in production or when measurement ID is available
let analytics = null;
if (firebaseConfig.measurementId && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    console.log('📊 Analytics initialized successfully');
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}
export { analytics };

export default app;
