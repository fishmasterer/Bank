/**
 * Get computed CSS variable value from the document root
 * @param {string} variableName - CSS variable name (e.g., '--primary-color')
 * @returns {string} The computed color value
 */
export const getCSSVariable = (variableName) => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
};

/**
 * Convert hex color to rgba
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export const hexToRgba = (hex, alpha = 1) => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Get theme colors for charts
 * @returns {Object} Object containing theme colors
 */
export const getThemeColors = () => {
  const primaryColor = getCSSVariable('--primary-color');
  const secondaryColor = getCSSVariable('--secondary-color');
  const successColor = getCSSVariable('--success-color');
  const dangerColor = getCSSVariable('--danger-color');
  const warningColor = getCSSVariable('--warning-color');
  const textPrimary = getCSSVariable('--text-primary');
  const textSecondary = getCSSVariable('--text-secondary');
  const borderColor = getCSSVariable('--border-color');
  const bgPrimary = getCSSVariable('--bg-primary');

  return {
    primary: primaryColor,
    primaryLight: hexToRgba(primaryColor, 0.1),
    primaryMedium: hexToRgba(primaryColor, 0.5),
    secondary: secondaryColor,
    secondaryLight: hexToRgba(secondaryColor, 0.1),
    success: successColor,
    successLight: hexToRgba(successColor, 0.1),
    danger: dangerColor,
    dangerLight: hexToRgba(dangerColor, 0.1),
    warning: warningColor,
    warningLight: hexToRgba(warningColor, 0.1),
    textPrimary,
    textSecondary,
    borderColor,
    bgPrimary,
  };
};

/**
 * Consistent color palette used throughout the app
 * Used for charts, member profiles, and other visual elements
 */
export const COLOR_PALETTE = [
  '#667eea', // Purple
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

/**
 * Get chart color palette - consistent colors for all charts
 * Uses the same palette as member profile presets for visual consistency
 * @returns {Array} Array of 8 colors for charts
 */
export const getChartColorPalette = () => {
  return COLOR_PALETTE;
};
