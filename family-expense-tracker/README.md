# Family Expense Tracker

A transparent family expense tracking application that helps family members manage and share monthly expenses. Built with React and designed for easy viewing on mobile devices.

## Features

- **Monthly Expense Tracking**: Track both planned/budgeted and actual paid expenses
- **Multiple Family Members**: Initially set up for 2 members, expandable to 4
- **Expense Types**: Support for both recurring and one-time expenses
- **Two View Modes**:
  - **Summary View**: Quick overview showing totals per person and overall total
  - **Detailed View**: Category-based breakdown with all expense details
- **Export Functionality**: Export monthly data to CSV for spreadsheet analysis
- **Historical Data**: Access up to 12 months of expense history
- **Mobile-Responsive**: Optimized for viewing on phones and tablets
- **Local Storage**: All data stored locally in the browser (no backend required)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd family-expense-tracker
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

## Usage

### Adding Expenses

1. Click the "+ Add Expense" button
2. Fill in the expense details:
   - Expense name
   - Category (Groceries, Utilities, Rent, etc.)
   - Who paid for it
   - Planned amount
   - Actual paid amount
   - Month and year
   - Mark as recurring if applicable
   - Add optional notes
3. Click "Add Expense"

### Viewing Expenses

- **Summary Tab**: See total amounts for each family member and overall totals
- **Detailed Tab**: Click on categories to expand and see individual expenses
- Navigate between months using the arrow buttons

### Editing/Deleting Expenses

- In the Detailed view, expand a category
- Click "Edit" to modify an expense
- Click "Delete" to remove an expense

### Exporting Data

- Click the "Export CSV" button to download a spreadsheet of the current month's expenses
- The export includes individual expenses and summary totals

## Deployment to Netlify

### Option 1: Deploy via Netlify CLI

1. Install Netlify CLI globally:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

### Option 2: Deploy via Netlify Website

1. Build the project:
   ```bash
   npm run build
   ```

2. Go to [Netlify](https://app.netlify.com/)
3. Drag and drop the `dist` folder to deploy

### Option 3: Connect Git Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com/)
3. Click "New site from Git"
4. Connect your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

## Customization

### Adding More Family Members

The app is configured for 2 family members by default. To add more:

1. Open the app in your browser
2. The data is stored in localStorage
3. You can manually edit family members in the ExpenseContext.jsx file (lines 10-13)

### Changing Categories

Edit the `CATEGORIES` array in `src/components/ExpenseForm.jsx` (lines 4-16) to add or modify expense categories.

## Data Storage

All data is stored locally in your browser's localStorage. This means:
- ✅ No server required
- ✅ Data persists between sessions
- ✅ Works offline
- ⚠️ Data is specific to the browser/device
- ⚠️ Clearing browser data will delete all expenses

To share data between devices, use the Export feature and keep CSV backups.

## Project Structure

```
family-expense-tracker/
├── src/
│   ├── components/
│   │   ├── SummaryView.jsx       # Summary overview component
│   │   ├── DetailedView.jsx      # Detailed breakdown component
│   │   ├── ExpenseForm.jsx       # Add/Edit expense form
│   │   └── *.css                 # Component styles
│   ├── context/
│   │   └── ExpenseContext.jsx    # State management
│   ├── utils/
│   │   └── exportData.js         # CSV export utility
│   ├── App.jsx                   # Main app component
│   ├── App.css                   # Main app styles
│   └── main.jsx                  # Entry point
├── netlify.toml                  # Netlify configuration
└── package.json
```

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is open source and available for personal use.

## Support

For issues or questions, please check the code comments or modify as needed for your specific use case.
