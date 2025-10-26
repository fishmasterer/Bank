# Family Expense Tracker - Viewer App

This is the **read-only viewer version** of the Family Expense Tracker. Perfect for viewing expenses without the ability to add, edit, or delete them. Ideal for sharing with family members who only need to see the expenses.

## Features

- 👀 **Read-Only**: View expenses without editing capabilities
- 📊 View planned vs paid amounts
- 👥 See expenses by family member
- 🔄 Real-time sync with Firebase (updates automatically)
- 📱 Mobile-responsive design
- 📥 Export to CSV
- 🗓️ Monthly and historical views
- ✨ Clean, simplified interface

## What's Different from Admin App?

- ❌ No "+ Add Expense" button
- ❌ No Edit/Delete buttons on expenses
- ✅ Only viewing and exporting capabilities
- ✅ Same real-time data as admin app
- ✅ Automatically updates when expenses are added via admin app

## Setup Instructions

### Prerequisites

The **Admin app** must be set up first with Firebase. This viewer app uses the **same Firebase project** and configuration.

### 1. Use Same Firebase Project

This app connects to the same Firebase project as the Admin app. You'll use the **exact same Firebase configuration**.

### 2. Configure the App

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in the **same Firebase configuration** you used for the Admin app:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 3. Install and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment to Netlify

Deploy this separately from the Admin app. You'll have two URLs:
- Admin URL: For family members who add expenses
- Viewer URL: For viewing only (share this with your dad)

### Option 1: Drag and Drop

1. Build the project:
   ```bash
   npm run build
   ```

2. Go to [Netlify](https://app.netlify.com/)

3. Drag and drop the `dist` folder

4. **Important:** Add the same environment variables in Netlify:
   - Go to Site Settings > Environment Variables
   - Add all your `VITE_FIREBASE_*` variables (same as Admin app)

### Option 2: Connect Git Repository

1. Push your code to GitHub/GitLab/Bitbucket (can be same repo, different folder)

2. Go to [Netlify](https://app.netlify.com/)

3. Click "New site from Git"

4. Connect your repository

5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `family-expense-viewer` (if in monorepo)
   - Add environment variables (all `VITE_FIREBASE_*` values - same as Admin app)

6. Click "Deploy site"

## Usage

### Viewing Expenses

- **Summary Tab**: See total amounts for each family member and overall totals
- **Detailed Tab**: Click on categories to expand and see individual expenses
- Navigate between months using the arrow buttons

### Exporting Data

- Click the "Export CSV" button to download a spreadsheet of the current month's expenses
- The export includes individual expenses and summary totals

## How Real-time Sync Works

1. Family members add expenses via the **Admin app**
2. Data is saved to Firebase Firestore
3. This **Viewer app** automatically receives updates in real-time
4. No page refresh needed - changes appear instantly!

## Recommended Setup

For your family:

1. **Admin App** → Deploy for family members who add expenses
   - Share this URL only with people who should add/edit expenses
   - They can use this on their phones to add expenses

2. **Viewer App** → Deploy for your dad
   - Share this URL with your dad
   - He can bookmark it on his phone
   - He'll always see the latest expenses
   - He cannot accidentally edit or delete anything

## Troubleshooting

### "Failed to load expenses" error
- Verify you're using the same Firebase config as the Admin app
- Check that Firestore database is created with proper rules
- Check browser console for detailed error messages

### Not seeing expenses
- Make sure you deployed the Admin app and added some expenses first
- Verify both apps use the exact same Firebase project ID
- Check that Firestore rules allow read access to everyone

### Real-time updates not working
- Check your internet connection
- Verify Firestore rules allow read access
- Try refreshing the page

## Firebase Security

The Firestore rules should allow read access to everyone (so the viewer works) but restrict write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{document=**} {
      allow read: if true;
      // Write only if authenticated (for Admin app)
      allow write: if true; // Change to 'if request.auth != null' when you add auth
    }

    match /familyMembers/{document=**} {
      allow read: if true;
      allow write: if true; // Change to 'if request.auth != null' when you add auth
    }
  }
}
```

## Data Privacy

- All data is stored in your Firebase project (you control it)
- Firebase is hosted by Google with enterprise-grade security
- You can add authentication to restrict who can view the data
- Export feature lets you keep local backups

## Related Apps

- **Admin App**: Full CRUD operations for family members to add/edit expenses
- Both apps share the same Firebase database

## Support

For setup help, refer to the Admin app README for Firebase setup instructions.
