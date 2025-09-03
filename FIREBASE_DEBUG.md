# Firebase Connection Debugging Guide

## 🔍 **Step 1: Check Environment Variables**

First, you need to create a `.env` file in your project root with your Firebase credentials.

### Create `.env` file:
```bash
# Create .env file in project root
touch .env
```

### Add your Firebase credentials to `.env`:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🔧 **Step 2: Get Your Firebase Credentials**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → "Project settings"
4. Scroll down to "Your apps" section
5. Click on your web app (or create one if none exists)
6. Copy the config values

## 🧪 **Step 3: Test the Connection**

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open the Reports page** in your browser

3. **Open browser console** (F12 → Console tab)

4. **Click the "Test Firebase Connection" button**

5. **Check the console output** for detailed debugging information

## 📊 **What to Look For in Console:**

### ✅ **Successful Connection:**
```
🔍 Starting comprehensive Firebase connection test...
📊 Database object: [Firestore object]
📁 Reports collection reference: [CollectionReference]
✅ Successfully queried collection
📄 Number of documents found: [number]
```

### ❌ **Common Issues:**

#### **1. Environment Variables Not Set:**
```
🔧 VITE_FIREBASE_API_KEY: Not set
🔧 VITE_FIREBASE_PROJECT_ID: Not set
```
**Solution:** Create `.env` file with correct credentials

#### **2. Collection Not Found:**
```
⚠️ No documents found in "Reports" collection
```
**Possible causes:**
- Collection name is different (check case sensitivity)
- Collection doesn't exist
- Security rules blocking access

#### **3. Permission Denied:**
```
❌ Error code: permission-denied
❌ Error message: Missing or insufficient permissions
```
**Solution:** Check Firestore security rules

#### **4. Invalid API Key:**
```
❌ Error code: invalid-api-key
```
**Solution:** Check your API key in `.env` file

## 🔐 **Step 4: Check Firestore Security Rules**

Go to Firebase Console → Firestore Database → Rules and ensure you have read access:

```javascript
// Basic read access (for testing)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;  // Allow all reads (for testing only)
      allow write: if false; // No writes
    }
  }
}
```

## 📁 **Step 5: Verify Collection Name**

Make sure your collection is named exactly **"Reports"** (with capital R):

1. Go to Firebase Console → Firestore Database
2. Look for the collection named "Reports"
3. If it's named differently, either:
   - Rename it to "Reports", or
   - Update the code to use the correct name

## 🚀 **Step 6: Test with Sample Data**

If you have no data, you can add a test document:

1. Go to Firebase Console → Firestore Database
2. Click "Start collection" (if no collections exist)
3. Collection ID: `Reports`
4. Add a test document with your data structure

## 📞 **Need Help?**

If you're still having issues, please share:
1. The console output from the test
2. Your Firebase project ID (not the full config)
3. Whether you can see the "Reports" collection in Firebase Console
4. Any error messages you're seeing 