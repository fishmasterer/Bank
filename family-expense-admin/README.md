# Family Expense Tracker - Admin App

This is the **admin version** of the Family Expense Tracker that allows family members to add, edit, and manage expenses. This app syncs data to Firebase Firestore in real-time.

## Features

- ✏️ Add, edit, and delete expenses
- 📊 Track planned and paid amounts
- 👥 Manage multiple family members
- 🔄 Real-time sync with Firebase
- 📱 Mobile-responsive design
- 📥 Export to CSV
- 🗓️ Monthly and historical views

## Setup Instructions

### 1. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if you want)
4. Once created, click "Add app" and select the Web icon (`</>`)
5. Register your app with a nickname (e.g., "Family Expense Admin")
6. Copy the Firebase configuration values

### 2. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Select a location close to you
4. **Start in production mode** (we'll set up rules next)
5. Click "Enable"

### 3. Set up Firestore Security Rules

In Firestore Database, go to **Rules** tab and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to everyone
    // Allow write access to everyone (you can add authentication later)
    match /expenses/{document=**} {
      allow read: if true;
      allow write: if true;
    }

    match /familyMembers/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

**Note:** These rules allow anyone to read/write. For production, you should add Firebase Authentication and restrict write access. See "Adding Authentication" section below.

### 4. Configure the App

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration values:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 5. Install and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment to Netlify

### Option 1: Drag and Drop

1. Build the project:
   ```bash
   npm run build
   ```

2. Go to [Netlify](https://app.netlify.com/)

3. Drag and drop the `dist` folder

4. **Important:** Add your environment variables in Netlify:
   - Go to Site Settings > Environment Variables
   - Add all your `VITE_FIREBASE_*` variables

### Option 2: Connect Git Repository

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [Netlify](https://app.netlify.com/)

3. Click "New site from Git"

4. Connect your repository

5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables (all `VITE_FIREBASE_*` values)

6. Click "Deploy site"

## Adding Firebase Authentication (Optional but Recommended)

To restrict who can add/edit expenses:

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable "Email/Password" provider
4. Add authorized users in the "Users" tab
5. Update Firestore rules to require authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /familyMembers/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

6. Update the app code to add login functionality (you'll need to implement this)

## Data Structure

### Expenses Collection

```javascript
{
  name: "Electric Bill",
  category: "Utilities",
  plannedAmount: 150.00,
  paidAmount: 152.50,
  paidBy: 1,
  year: 2025,
  month: 10,
  isRecurring: true,
  notes: "October bill",
  createdAt: "2025-10-26T10:00:00.000Z",
  updatedAt: "2025-10-26T10:00:00.000Z"
}
```

### Family Members Collection

```javascript
{
  id: 1,
  name: "John"
}
```

## Troubleshooting

### "Failed to load expenses" error
- Check that your Firebase configuration in `.env` is correct
- Ensure Firestore database is created and rules are set
- Check browser console for detailed error messages

### Environment variables not working
- Make sure variable names start with `VITE_`
- Restart the dev server after changing `.env`
- In Netlify, ensure all variables are set in Site Settings

### Real-time updates not working
- Check your internet connection
- Verify Firestore rules allow read access
- Check browser console for errors

## Related Apps

- **Viewer App**: Read-only version for viewing expenses (deploy separately)
- Both apps share the same Firebase database

## Support

For issues or questions, check the Firebase documentation or verify your configuration.
