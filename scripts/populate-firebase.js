// Firebase Data Population Script
// Run this script to populate your Firebase database with sample data
// Make sure to set up your Firebase credentials first

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Your Firebase configuration - replace with your actual values
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "your-project",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data for installations
const sampleInstallations = [
  {
    hospitalName: "City General Hospital",
    productName: "MRI Scanner",
    productModel: "Premium 3T",
    region: "North",
    state: "California",
    installationDate: Timestamp.fromDate(new Date("2024-01-15")),
    engineerId: "engineer_001",
    engineerName: "John Doe",
    status: "completed",
    productsPerOrder: 2,
    revenue: 1500000,
    failureReported: false,
    productCategory: "MRI"
  },
  {
    hospitalName: "Memorial Medical Center",
    productName: "CT Scanner",
    productModel: "Advanced 64-Slice",
    region: "South",
    state: "Texas",
    installationDate: Timestamp.fromDate(new Date("2024-01-20")),
    engineerId: "engineer_002",
    engineerName: "Jane Smith",
    status: "completed",
    productsPerOrder: 1,
    revenue: 800000,
    failureReported: false,
    productCategory: "CT"
  },
  {
    hospitalName: "Regional Health Center",
    productName: "X-Ray Machine",
    productModel: "Digital Pro",
    region: "East",
    state: "New York",
    installationDate: Timestamp.fromDate(new Date("2024-02-01")),
    engineerId: "engineer_003",
    engineerName: "Mike Johnson",
    status: "completed",
    productsPerOrder: 3,
    revenue: 300000,
    failureReported: true,
    failureDate: Timestamp.fromDate(new Date("2024-02-15")),
    failureReason: "Software malfunction",
    productCategory: "X-Ray"
  },
  {
    hospitalName: "Community Hospital",
    productName: "Ultrasound",
    productModel: "Portable Elite",
    region: "West",
    state: "Oregon",
    installationDate: Timestamp.fromDate(new Date("2024-02-10")),
    engineerId: "engineer_001",
    engineerName: "John Doe",
    status: "completed",
    productsPerOrder: 1,
    revenue: 120000,
    failureReported: false,
    productCategory: "Ultrasound"
  },
  {
    hospitalName: "University Medical Center",
    productName: "ECG Machine",
    productModel: "CardioSync Pro",
    region: "Central",
    state: "Illinois",
    installationDate: Timestamp.fromDate(new Date("2024-02-20")),
    engineerId: "engineer_004",
    engineerName: "Sarah Wilson",
    status: "completed",
    productsPerOrder: 2,
    revenue: 180000,
    failureReported: false,
    productCategory: "ECG"
  },
  {
    hospitalName: "Veterans Hospital",
    productName: "MRI Scanner",
    productModel: "Standard 1.5T",
    region: "North",
    state: "Washington",
    installationDate: Timestamp.fromDate(new Date("2024-03-01")),
    engineerId: "engineer_002",
    engineerName: "Jane Smith",
    status: "completed",
    productsPerOrder: 1,
    revenue: 900000,
    failureReported: true,
    failureDate: Timestamp.fromDate(new Date("2024-03-10")),
    failureReason: "Cooling system failure",
    productCategory: "MRI"
  }
];

// Sample data for reports
const sampleReports = [
  {
    hospitalName: "City General Hospital",
    priority: "critical",
    createdAt: Timestamp.fromDate(new Date("2024-01-16")),
    updatedAt: Timestamp.fromDate(new Date("2024-01-16")),
    description: "MRI scanner showing error code E-101, patient scans delayed",
    status: "open",
    assignedTo: "engineer_001",
    category: "Technical Issue"
  },
  {
    hospitalName: "Regional Health Center",
    priority: "pending",
    createdAt: Timestamp.fromDate(new Date("2024-02-02")),
    updatedAt: Timestamp.fromDate(new Date("2024-02-02")),
    description: "X-Ray machine calibration needed",
    status: "in-progress",
    assignedTo: "engineer_003",
    category: "Maintenance"
  },
  {
    hospitalName: "Veterans Hospital",
    priority: "critical",
    createdAt: Timestamp.fromDate(new Date("2024-03-02")),
    updatedAt: Timestamp.fromDate(new Date("2024-03-02")),
    description: "MRI scanner completely non-functional",
    status: "open",
    assignedTo: "engineer_002",
    category: "Critical Failure"
  }
];

// Sample data for product failures
const sampleProductFailures = [
  {
    productName: "MRI Scanner",
    productModel: "Premium 3T",
    failureCount: 2,
    totalInstallations: 3,
    failureRate: 66.7,
    lastFailureDate: Timestamp.fromDate(new Date("2024-03-10")),
    commonIssues: ["Cooling system failure", "Software malfunction"]
  },
  {
    productName: "X-Ray Machine",
    productModel: "Digital Pro",
    failureCount: 1,
    totalInstallations: 1,
    failureRate: 100.0,
    lastFailureDate: Timestamp.fromDate(new Date("2024-02-15")),
    commonIssues: ["Software malfunction"]
  },
  {
    productName: "CT Scanner",
    productModel: "Advanced 64-Slice",
    failureCount: 0,
    totalInstallations: 1,
    failureRate: 0.0,
    lastFailureDate: Timestamp.fromDate(new Date("2024-01-20")),
    commonIssues: []
  }
];

// Sample data for feedback
const sampleFeedback = [
  {
    hospitalName: "City General Hospital",
    priority: "positive",
    message: "Excellent service from engineer John Doe. Quick resolution of the MRI issue.",
    createdAt: Timestamp.fromDate(new Date("2024-01-17")),
    reportId: "report_001"
  },
  {
    hospitalName: "Regional Health Center",
    priority: "pending",
    message: "Follow-up needed on X-Ray calibration. Still experiencing minor issues.",
    createdAt: Timestamp.fromDate(new Date("2024-02-03")),
    reportId: "report_002"
  }
];

// Function to populate data
async function populateFirebase() {
  try {
    console.log('Starting Firebase data population...');

    // Add installations
    console.log('Adding installations...');
    for (const installation of sampleInstallations) {
      await addDoc(collection(db, 'installations'), installation);
    }
    console.log('✅ Installations added successfully');

    // Add reports
    console.log('Adding reports...');
    for (const report of sampleReports) {
      await addDoc(collection(db, 'reports'), report);
    }
    console.log('✅ Reports added successfully');

    // Add product failures
    console.log('Adding product failures...');
    for (const failure of sampleProductFailures) {
      await addDoc(collection(db, 'productFailures'), failure);
    }
    console.log('✅ Product failures added successfully');

    // Add feedback
    console.log('Adding feedback...');
    for (const feedback of sampleFeedback) {
      await addDoc(collection(db, 'feedback'), feedback);
    }
    console.log('✅ Feedback added successfully');

    console.log('🎉 All data populated successfully!');
    console.log('You can now test your dashboard with real data.');

  } catch (error) {
    console.error('Error populating Firebase:', error);
  }
}

// Run the population script
if (require.main === module) {
  populateFirebase();
}

module.exports = { populateFirebase }; 