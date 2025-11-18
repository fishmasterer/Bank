// Category color gradients for visual consistency across the app
const categoryGradients = {
  // Essential categories
  'Rent': { from: '#667eea', to: '#764ba2' },
  'Mortgage': { from: '#667eea', to: '#764ba2' },
  'Utilities': { from: '#f093fb', to: '#f5576c' },
  'Electric': { from: '#ffecd2', to: '#fcb69f' },
  'Water': { from: '#4facfe', to: '#00f2fe' },
  'Gas': { from: '#fa709a', to: '#fee140' },
  'Internet': { from: '#30cfd0', to: '#330867' },
  'Phone': { from: '#a8edea', to: '#fed6e3' },

  // Food & Household
  'Groceries': { from: '#11998e', to: '#38ef7d' },
  'Food': { from: '#11998e', to: '#38ef7d' },
  'Dining Out': { from: '#f12711', to: '#f5af19' },
  'Restaurants': { from: '#f12711', to: '#f5af19' },
  'Coffee': { from: '#c79081', to: '#dfa579' },

  // Transportation
  'Transportation': { from: '#667eea', to: '#764ba2' },
  'Gas/Fuel': { from: '#f093fb', to: '#f5576c' },
  'Car Payment': { from: '#4facfe', to: '#00f2fe' },
  'Car Insurance': { from: '#43e97b', to: '#38f9d7' },
  'Parking': { from: '#fa709a', to: '#fee140' },
  'Public Transit': { from: '#30cfd0', to: '#330867' },

  // Health & Insurance
  'Healthcare': { from: '#ff0844', to: '#ffb199' },
  'Health': { from: '#ff0844', to: '#ffb199' },
  'Insurance': { from: '#667eea', to: '#764ba2' },
  'Medical': { from: '#f093fb', to: '#f5576c' },
  'Dental': { from: '#4facfe', to: '#00f2fe' },
  'Pharmacy': { from: '#43e97b', to: '#38f9d7' },

  // Entertainment & Lifestyle
  'Entertainment': { from: '#f857a6', to: '#ff5858' },
  'Streaming': { from: '#a8c0ff', to: '#3f2b96' },
  'Subscriptions': { from: '#f093fb', to: '#f5576c' },
  'Hobbies': { from: '#ffecd2', to: '#fcb69f' },
  'Shopping': { from: '#667eea', to: '#764ba2' },
  'Clothing': { from: '#fa709a', to: '#fee140' },

  // Financial
  'Savings': { from: '#11998e', to: '#38ef7d' },
  'Investments': { from: '#0052d4', to: '#65c7f7' },
  'Debt Payment': { from: '#f12711', to: '#f5af19' },
  'Loans': { from: '#c79081', to: '#dfa579' },
  'Credit Card': { from: '#ff0844', to: '#ffb199' },

  // Education & Kids
  'Education': { from: '#4facfe', to: '#00f2fe' },
  'School': { from: '#667eea', to: '#764ba2' },
  'Kids': { from: '#f093fb', to: '#f5576c' },
  'Childcare': { from: '#a8edea', to: '#fed6e3' },
  'Activities': { from: '#ffecd2', to: '#fcb69f' },

  // Miscellaneous
  'Personal Care': { from: '#f857a6', to: '#ff5858' },
  'Gifts': { from: '#fa709a', to: '#fee140' },
  'Travel': { from: '#30cfd0', to: '#330867' },
  'Vacation': { from: '#4facfe', to: '#00f2fe' },
  'Pet': { from: '#c79081', to: '#dfa579' },
  'Pets': { from: '#c79081', to: '#dfa579' },
  'Home Maintenance': { from: '#43e97b', to: '#38f9d7' },
  'Other': { from: '#6a85b6', to: '#bac8e0' },
  'Miscellaneous': { from: '#6a85b6', to: '#bac8e0' }
};

// Default gradients for categories not in the list
const defaultGradients = [
  { from: '#667eea', to: '#764ba2' },
  { from: '#f093fb', to: '#f5576c' },
  { from: '#4facfe', to: '#00f2fe' },
  { from: '#43e97b', to: '#38f9d7' },
  { from: '#fa709a', to: '#fee140' },
  { from: '#30cfd0', to: '#330867' },
  { from: '#a8edea', to: '#fed6e3' },
  { from: '#ffecd2', to: '#fcb69f' },
  { from: '#f857a6', to: '#ff5858' },
  { from: '#11998e', to: '#38ef7d' },
  { from: '#c79081', to: '#dfa579' },
  { from: '#6a85b6', to: '#bac8e0' }
];

// Simple hash function for consistent color assignment
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Get gradient colors for a category
export const getCategoryGradient = (category) => {
  // Check for exact match first (case-insensitive)
  const normalizedCategory = Object.keys(categoryGradients).find(
    key => key.toLowerCase() === category.toLowerCase()
  );

  if (normalizedCategory) {
    return categoryGradients[normalizedCategory];
  }

  // Check for partial matches
  for (const [key, gradient] of Object.entries(categoryGradients)) {
    if (category.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(category.toLowerCase())) {
      return gradient;
    }
  }

  // Use hash for consistent color assignment
  const index = hashString(category) % defaultGradients.length;
  return defaultGradients[index];
};

// Get CSS gradient string
export const getCategoryGradientStyle = (category) => {
  const gradient = getCategoryGradient(category);
  return `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`;
};

// Get primary color for a category (for borders, icons, etc.)
export const getCategoryColor = (category) => {
  const gradient = getCategoryGradient(category);
  return gradient.from;
};

export default {
  getCategoryGradient,
  getCategoryGradientStyle,
  getCategoryColor
};
