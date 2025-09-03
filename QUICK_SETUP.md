# Quick Setup Guide - Connect to Your Existing Firebase Project

## Step 1: Get Your Firebase Configuration

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click the web icon (</>) to add one
7. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 2: Create Environment File

1. Create a `.env` file in your project root (same level as `package.json`)
2. Add your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 3: Verify Your Firestore Collections

Make sure your Firestore database has these collections:
- `installations` - for installation data
- `reports` - for reports and issues
- `productFailures` - for failure tracking
- `feedback` - for user feedback
- `users` - for user profiles (optional, will be created automatically)

## Step 4: Set Up Authentication

1. In Firebase Console, go to "Authentication"
2. Make sure "Email/Password" sign-in method is enabled
3. Create a test user:
   - Go to "Users" tab
   - Click "Add user"
   - Enter email and password
   - This will be your login credentials

## Step 5: Add Sample Data (Optional)

If you want to test the dashboard with sample data:

1. Install dependencies if not already done:
   ```bash
   npm install
   ```

2. Run the sample data script:
   ```bash
   node scripts/populate-firebase.js
   ```

## Step 6: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Use the credentials you created in Firebase Authentication
4. You should see the dashboard with real-time data

## Troubleshooting

### Authentication Issues
- Make sure email/password auth is enabled in Firebase
- Check that your environment variables are correct
- Restart your dev server after adding `.env` file

### Data Not Loading
- Verify Firestore rules allow read access
- Check that collections exist in your database
- Look for errors in browser console

### Environment Variables Not Working
- Make sure `.env` file is in the project root
- Restart your development server
- Check that variable names start with `VITE_`

## Your Dashboard Features

Once connected, your dashboard will include:

✅ **Real-time Data**: All charts update automatically when data changes
✅ **Authentication**: Secure login with Firebase Auth
✅ **KPI Cards**: Total installations, monthly averages, repeat rates
✅ **Interactive Charts**: 
   - Line chart: Installations trend over 12 months
   - Bar chart: Product-wise installation counts
   - Pie chart: Model distribution
   - Regional performance charts
✅ **Failure Tracking**: Product failure analysis
✅ **Export Features**: Excel export of filtered data
✅ **Responsive Design**: Works on desktop and mobile

## Next Steps

1. Customize the dashboard colors and branding
2. Add more data to see the charts populate
3. Set up user roles and permissions
4. Configure production deployment
5. Add real-time notifications

Your dashboard is now ready to use with your existing Firebase project! 🎉 