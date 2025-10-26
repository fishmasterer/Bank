# Family Expense Tracker

A complete family expense tracking solution with separate apps for managing and viewing expenses, powered by Firebase Firestore for real-time synchronization.

## Project Structure

This repository contains **two separate applications** that work together:

```
Bank/
├── family-expense-admin/     # Admin app (Add/Edit/Delete expenses)
├── family-expense-viewer/    # Viewer app (Read-only)
└── family-expense-tracker/   # Original version (localStorage-based)
```

## The Two Apps

### 1. Admin App (`family-expense-admin/`)

**For:** Family members who add and manage expenses

**Features:**
- ✏️ Add, edit, and delete expenses
- 📊 Track planned vs paid amounts
- 👥 Manage family members
- 🔄 Real-time sync via Firebase Firestore
- 📱 Mobile-responsive
- 📥 Export to CSV

**Deploy to:** Netlify (or similar) - Share URL with family members

---

### 2. Viewer App (`family-expense-viewer/`)

**For:** Your dad (or anyone who should only view expenses)

**Features:**
- 👀 Read-only view (no editing)
- 📊 See all expenses in real-time
- 🗓️ Monthly and historical views
- 📥 Export to CSV
- 📱 Mobile-optimized
- ✨ Simplified, clean interface

**Deploy to:** Netlify (or similar) - Share URL with your dad

---

## How It Works

```
┌─────────────────────┐
│  Family Members     │
│  (Admin App)        │──┐
│  Add/Edit Expenses  │  │
└─────────────────────┘  │
                          ├──► Firebase Firestore ◄──┐
┌─────────────────────┐  │         (Database)        │
│  Other Family       │  │                            │
│  Members            │──┘                            │
│  (Admin App)        │                               │
└─────────────────────┘                               │
                                                       │
┌─────────────────────┐                               │
│  Your Dad           │                               │
│  (Viewer App)       │───────────────────────────────┘
│  View Only          │       Sees updates in real-time
└─────────────────────┘
```

1. Family members use **Admin App** to add expenses
2. Data saves to **Firebase Firestore** (cloud database)
3. Your dad's **Viewer App** automatically shows updates in real-time
4. Everyone sees the same data, but only admin users can edit

## Quick Start Guide

### Step 1: Set up Firebase (One Time)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Set up security rules (see Admin app README)
5. Copy your Firebase configuration values

### Step 2: Deploy Admin App

1. Navigate to `family-expense-admin/`
2. Follow the README instructions
3. Deploy to Netlify
4. Share URL with family members who add expenses

### Step 3: Deploy Viewer App

1. Navigate to `family-expense-viewer/`
2. Use the **same Firebase config** as Admin app
3. Deploy to Netlify (separate deployment)
4. Share URL with your dad

### Step 4: Start Using

- Family members visit Admin URL to add expenses
- Your dad visits Viewer URL to see expenses
- Everything syncs automatically!

## Cost

**100% Free** for typical family use:

- ✅ Firebase Free Tier: 50K reads/day, 20K writes/day
- ✅ Netlify Free Tier: 100GB bandwidth/month
- ✅ No credit card required for either service

## Which README Should I Read?

- **Setting up for the first time?** → Start with `family-expense-admin/README.md`
- **Deploying the viewer app?** → Read `family-expense-viewer/README.md`
- **Want the old localStorage version?** → See `family-expense-tracker/README.md`

## Key Features

### Real-Time Synchronization
- Updates appear instantly across all devices
- No page refresh needed
- Always see the latest data

### Mobile-Optimized
- Works perfectly on phones
- Your dad can check expenses anytime on his phone
- Easy to add expenses on the go

### Transparent & Secure
- Your dad sees exactly what you add
- Data stored in your own Firebase project
- Can add authentication for extra security

### Export Functionality
- Download CSV files for any month
- Keep offline backups
- Analyze in Excel/Sheets

## Support

- **Admin App Setup:** See `family-expense-admin/README.md`
- **Viewer App Setup:** See `family-expense-viewer/README.md`
- **Firebase Help:** [Firebase Documentation](https://firebase.google.com/docs)
- **Netlify Help:** [Netlify Documentation](https://docs.netlify.com/)

## Migration from Old Version

The `family-expense-tracker/` folder contains the original localStorage-based version.

To migrate:
1. Export data from old version (if you have any)
2. Manually add expenses to new Admin app
3. Old and new versions can't share data automatically

## License

Open source for personal use.
