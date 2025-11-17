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
 * Get chart color palette using theme colors
 * @returns {Array} Array of colors for charts
 */
export const getChartColorPalette = () => {
  const colors = getThemeColors();
  return [
    colors.primary,
    colors.success,
    colors.warning,
    colors.danger,
    colors.secondary,
    hexToRgba(colors.primary, 0.7),
    hexToRgba(colors.success, 0.7),
    hexToRgba(colors.warning, 0.7),
    hexToRgba(colors.danger, 0.7),
    hexToRgba(colors.secondary, 0.7),
  ];
};
