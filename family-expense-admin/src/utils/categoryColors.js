// Category color gradients and icons for visual consistency across the app
const categoryData = {
  // Essential categories
  'Rent': { from: '#667eea', to: '#764ba2', icon: '🏠' },
  'Mortgage': { from: '#667eea', to: '#764ba2', icon: '🏡' },
  'Utilities': { from: '#f093fb', to: '#f5576c', icon: '⚡' },
  'Electric': { from: '#ffecd2', to: '#fcb69f', icon: '💡' },
  'Water': { from: '#4facfe', to: '#00f2fe', icon: '💧' },
  'Gas': { from: '#fa709a', to: '#fee140', icon: '🔥' },
  'Internet': { from: '#30cfd0', to: '#330867', icon: '📶' },
  'Phone': { from: '#a8edea', to: '#fed6e3', icon: '📱' },

  // Food & Household
  'Groceries': { from: '#11998e', to: '#38ef7d', icon: '🛒' },
  'Food': { from: '#11998e', to: '#38ef7d', icon: '🍽️' },
  'Dining Out': { from: '#f12711', to: '#f5af19', icon: '🍴' },
  'Restaurants': { from: '#f12711', to: '#f5af19', icon: '🍕' },
  'Coffee': { from: '#c79081', to: '#dfa579', icon: '☕' },

  // Transportation
  'Transportation': { from: '#667eea', to: '#764ba2', icon: '🚗' },
  'Gas/Fuel': { from: '#f093fb', to: '#f5576c', icon: '⛽' },
  'Car Payment': { from: '#4facfe', to: '#00f2fe', icon: '🚙' },
  'Car Insurance': { from: '#43e97b', to: '#38f9d7', icon: '🛡️' },
  'Parking': { from: '#fa709a', to: '#fee140', icon: '🅿️' },
  'Public Transit': { from: '#30cfd0', to: '#330867', icon: '🚌' },

  // Health & Insurance
  'Healthcare': { from: '#ff0844', to: '#ffb199', icon: '🏥' },
  'Health': { from: '#ff0844', to: '#ffb199', icon: '❤️' },
  'Insurance': { from: '#667eea', to: '#764ba2', icon: '📋' },
  'Medical': { from: '#f093fb', to: '#f5576c', icon: '💊' },
  'Dental': { from: '#4facfe', to: '#00f2fe', icon: '🦷' },
  'Pharmacy': { from: '#43e97b', to: '#38f9d7', icon: '💉' },

  // Entertainment & Lifestyle
  'Entertainment': { from: '#f857a6', to: '#ff5858', icon: '🎬' },
  'Streaming': { from: '#a8c0ff', to: '#3f2b96', icon: '📺' },
  'Subscriptions': { from: '#f093fb', to: '#f5576c', icon: '📧' },
  'Hobbies': { from: '#ffecd2', to: '#fcb69f', icon: '🎨' },
  'Shopping': { from: '#667eea', to: '#764ba2', icon: '🛍️' },
  'Clothing': { from: '#fa709a', to: '#fee140', icon: '👕' },

  // Financial
  'Savings': { from: '#11998e', to: '#38ef7d', icon: '💰' },
  'Investments': { from: '#0052d4', to: '#65c7f7', icon: '📈' },
  'Debt Payment': { from: '#f12711', to: '#f5af19', icon: '💳' },
  'Loans': { from: '#c79081', to: '#dfa579', icon: '🏦' },
  'Credit Card': { from: '#ff0844', to: '#ffb199', icon: '💳' },

  // Education & Kids
  'Education': { from: '#4facfe', to: '#00f2fe', icon: '📚' },
  'School': { from: '#667eea', to: '#764ba2', icon: '🎓' },
  'Kids': { from: '#f093fb', to: '#f5576c', icon: '👶' },
  'Childcare': { from: '#a8edea', to: '#fed6e3', icon: '🧒' },
  'Activities': { from: '#ffecd2', to: '#fcb69f', icon: '⚽' },

  // Miscellaneous
  'Personal Care': { from: '#f857a6', to: '#ff5858', icon: '💆' },
  'Gifts': { from: '#fa709a', to: '#fee140', icon: '🎁' },
  'Travel': { from: '#30cfd0', to: '#330867', icon: '✈️' },
  'Vacation': { from: '#4facfe', to: '#00f2fe', icon: '🏖️' },
  'Pet': { from: '#c79081', to: '#dfa579', icon: '🐕' },
  'Pets': { from: '#c79081', to: '#dfa579', icon: '🐾' },
  'Home Maintenance': { from: '#43e97b', to: '#38f9d7', icon: '🔧' },
  'Other': { from: '#6a85b6', to: '#bac8e0', icon: '📦' },
  'Miscellaneous': { from: '#6a85b6', to: '#bac8e0', icon: '🗂️' }
};

// Default data for categories not in the list
const defaultData = [
  { from: '#667eea', to: '#764ba2', icon: '📁' },
  { from: '#f093fb', to: '#f5576c', icon: '📂' },
  { from: '#4facfe', to: '#00f2fe', icon: '📋' },
  { from: '#43e97b', to: '#38f9d7', icon: '📊' },
  { from: '#fa709a', to: '#fee140', icon: '📌' },
  { from: '#30cfd0', to: '#330867', icon: '📎' },
  { from: '#a8edea', to: '#fed6e3', icon: '🏷️' },
  { from: '#ffecd2', to: '#fcb69f', icon: '📝' },
  { from: '#f857a6', to: '#ff5858', icon: '💼' },
  { from: '#11998e', to: '#38ef7d', icon: '📈' },
  { from: '#c79081', to: '#dfa579', icon: '📉' },
  { from: '#6a85b6', to: '#bac8e0', icon: '📦' }
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

// Get full category data (gradient + icon)
export const getCategoryData = (category) => {
  // Check for exact match first (case-insensitive)
  const normalizedCategory = Object.keys(categoryData).find(
    key => key.toLowerCase() === category.toLowerCase()
  );

  if (normalizedCategory) {
    return categoryData[normalizedCategory];
  }

  // Check for partial matches
  for (const [key, data] of Object.entries(categoryData)) {
    if (category.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(category.toLowerCase())) {
      return data;
    }
  }

  // Use hash for consistent assignment
  const index = hashString(category) % defaultData.length;
  return defaultData[index];
};

// Get gradient colors for a category
export const getCategoryGradient = (category) => {
  const data = getCategoryData(category);
  return { from: data.from, to: data.to };
};

// Get CSS gradient string
export const getCategoryGradientStyle = (category) => {
  const data = getCategoryData(category);
  return `linear-gradient(135deg, ${data.from} 0%, ${data.to} 100%)`;
};

// Get primary color for a category (for borders, icons, etc.)
export const getCategoryColor = (category) => {
  const data = getCategoryData(category);
  return data.from;
};

// Get icon for a category
export const getCategoryIcon = (category) => {
  const data = getCategoryData(category);
  return data.icon;
};

// Get icon with color styling (returns object for flexible rendering)
export const getCategoryIconStyled = (category) => {
  const data = getCategoryData(category);
  return {
    icon: data.icon,
    color: data.from,
    gradient: `linear-gradient(135deg, ${data.from} 0%, ${data.to} 100%)`
  };
};

export default {
  getCategoryGradient,
  getCategoryGradientStyle,
  getCategoryColor,
  getCategoryIcon,
  getCategoryIconStyled,
  getCategoryData
};
