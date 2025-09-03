# Firebase Setup Guide for FieldConnect Dashboard

## 1. Firebase Project Setup

### Create a New Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "fieldconnect-dashboard")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

### Enable Authentication
1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

### Create Firestore Database
1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location closest to your users
5. Click "Done"

## 2. Get Firebase Configuration

### Web App Configuration
1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "fieldconnect-web")
6. Copy the configuration object

### Environment Variables Setup
Create a `.env` file in your project root with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 3. Firestore Security Rules

### Basic Security Rules
Update your Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read all data
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         resource.data.createdBy == request.auth.uid);
    }
    
    // Specific rules for installations
    match /installations/{installationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         resource.data.engineerId == request.auth.uid);
    }
    
    // Specific rules for reports
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         resource.data.assignedTo == request.auth.uid);
    }
  }
}
```

## 4. Sample Data Structure

### Installations Collection
```javascript
{
  "id": "auto-generated",
  "hospitalName": "City General Hospital",
  "productName": "MRI Scanner",
  "productModel": "Premium 3T",
  "region": "North",
  "state": "California",
  "installationDate": "2024-01-15T10:00:00Z",
  "engineerId": "engineer_123",
  "engineerName": "John Doe",
  "status": "completed",
  "productsPerOrder": 2,
  "revenue": 1500000,
  "failureReported": false,
  "productCategory": "MRI"
}
```

### Reports Collection
```javascript
{
  "id": "auto-generated",
  "hospitalName": "City General Hospital",
  "priority": "critical",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "description": "MRI scanner showing error code E-101",
  "status": "open",
  "assignedTo": "engineer_123",
  "category": "Technical Issue"
}
```

### Product Failures Collection
```javascript
{
  "id": "auto-generated",
  "productName": "MRI Scanner",
  "productModel": "Premium 3T",
  "failureCount": 5,
  "totalInstallations": 50,
  "failureRate": 10.0,
  "lastFailureDate": "2024-01-15T10:00:00Z",
  "commonIssues": ["Cooling system failure", "Software crash"]
}
```

### Users Collection
```javascript
{
  "uid": "user_uid_from_auth",
  "email": "analyst@company.com",
  "role": "analyst",
  "displayName": "John Analyst",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## 5. Adding Sample Data

### Using Firebase Console
1. Go to Firestore Database in Firebase Console
2. Click "Start collection"
3. Create collections: `installations`, `reports`, `productFailures`, `users`
4. Add sample documents with the structure above

### Using Firebase Admin SDK (Optional)
For bulk data import, you can use the Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Add sample installations
const sampleInstallations = [
  {
    hospitalName: "City General Hospital",
    productName: "MRI Scanner",
    productModel: "Premium 3T",
    region: "North",
    state: "California",
    installationDate: new Date("2024-01-15"),
    engineerId: "engineer_123",
    engineerName: "John Doe",
    status: "completed",
    productsPerOrder: 2,
    revenue: 1500000,
    failureReported: false,
    productCategory: "MRI"
  }
  // Add more sample data...
];

sampleInstallations.forEach(async (installation) => {
  await db.collection('installations').add(installation);
});
```

## 6. User Management

### Creating Users
1. Go to Authentication > Users in Firebase Console
2. Click "Add user"
3. Enter email and password
4. Create corresponding user document in Firestore

### User Roles
- **analyst**: Can view all data, create reports
- **admin**: Can view, create, edit, and delete all data

## 7. Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Use the credentials you created in Firebase Authentication
4. Verify that you can access the dashboard and see real-time data

## 8. Production Deployment

### Environment Variables
Make sure to set up environment variables in your production environment:
- Vercel: Add environment variables in project settings
- Netlify: Add environment variables in site settings
- Other platforms: Follow their respective documentation

### Security Rules
Before going to production:
1. Update Firestore security rules to be more restrictive
2. Enable authentication providers as needed
3. Set up proper user roles and permissions
4. Configure Firebase App Check for additional security

## 9. Troubleshooting

### Common Issues
1. **Authentication not working**: Check if email/password auth is enabled
2. **Data not loading**: Verify Firestore rules allow read access
3. **Environment variables not working**: Restart your development server
4. **CORS issues**: Check Firebase project settings and allowed domains

### Debug Mode
Enable debug mode in your Firebase config for development:
```javascript
const firebaseConfig = {
  // ... your config
  projectId: 'your-project-id',
  // Add this for development
  ...(import.meta.env.DEV && { debug: true })
};
```

## 10. Next Steps

1. Set up Firebase Analytics for usage tracking
2. Configure Firebase Hosting for deployment
3. Set up automated backups
4. Implement user management features
5. Add real-time notifications
6. Set up monitoring and alerting

For more information, visit the [Firebase Documentation](https://firebase.google.com/docs). 