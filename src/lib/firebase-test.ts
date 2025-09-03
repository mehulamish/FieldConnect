// Firebase Connection Test Utility
// Use this to verify your Firebase connection is working

import { auth, db } from './firebase';
import { collection, getDocs, doc, getDoc, onSnapshot, query, limit } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export const testFirebaseConnection = async () => {
  console.log('🔍 Starting comprehensive Firebase connection test...');
  
  try {
    // Test 1: Check if db object exists
    console.log('📊 Database object:', db);
    console.log('📊 Database type:', typeof db);
    console.log('📊 Database constructor:', db.constructor.name);
    
    // Test 2: Try to get collection reference
    const reportsRef = collection(db, 'Reports');
    console.log('📁 Reports collection reference:', reportsRef);
    console.log('📁 Collection path:', reportsRef.path);
    console.log('📁 Collection id:', reportsRef.id);
    
    // Test 3: Try to get a single document to test permissions
    console.log('🔍 Testing document access...');
    try {
      const querySnapshot = await getDocs(query(reportsRef, limit(1)));
      console.log('✅ Successfully queried collection');
      console.log('📄 Number of documents found:', querySnapshot.size);
      
      if (!querySnapshot.empty) {
        const firstDoc = querySnapshot.docs[0];
        console.log('📄 First document ID:', firstDoc.id);
        console.log('📄 First document data:', firstDoc.data());
        console.log('📄 First document exists:', firstDoc.exists());
      } else {
        console.log('⚠️ Collection exists but is empty');
      }
    } catch (error) {
      console.error('❌ Error querying collection:', error);
      console.error('❌ Error code:', (error as any).code);
      console.error('❌ Error message:', (error as any).message);
    }
    
    // Test 4: Check environment variables
    console.log('🔧 Environment variables check:');
    console.log('🔧 VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('🔧 VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Not set');
    console.log('🔧 VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Not set');
    
    // Test 5: Try real-time listener
    console.log('🔍 Testing real-time listener...');
    const unsubscribe = onSnapshot(
      reportsRef,
      (snapshot) => {
        console.log('📡 Real-time update received:');
        console.log('📄 Number of documents:', snapshot.size);
        console.log('📄 Empty:', snapshot.empty);
        
        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            console.log('📄 Document ID:', doc.id);
            console.log('📄 Document data keys:', Object.keys(doc.data()));
          });
        }
      },
      (error) => {
        console.error('❌ Real-time listener error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
      }
    );
    
    // Clean up listener after 5 seconds
    setTimeout(() => {
      console.log('🛑 Cleaning up real-time listener...');
      unsubscribe();
    }, 5000);
    
    return { success: true, message: 'Firebase connection test completed' };
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return { success: false, error };
  }
};

export const listAllCollections = async () => {
  console.log('🔍 Attempting to list all collections...');
  
  try {
    // Note: This might not work due to security rules, but worth trying
    const collections = await getDocs(collection(db, ''));
    console.log('📁 Collections found:', collections);
  } catch (error) {
    console.log('⚠️ Cannot list collections (this is normal due to security rules):', error);
  }
};

export const testSpecificDocument = async (docId: string) => {
  console.log(`🔍 Testing specific document: ${docId}`);
  
  try {
    const docRef = doc(db, 'Reports', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Document exists:', docSnap.data());
    } else {
      console.log('❌ Document does not exist');
    }
  } catch (error) {
    console.error('❌ Error accessing document:', error);
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testFirebase = testFirebaseConnection;
} 