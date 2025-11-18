import { useCallback } from 'react';

/**
 * Custom hook for creating touch ripple effects
 * Returns a function to create ripple on click/touch
 */
const useRipple = () => {
  const createRipple = useCallback((event, dark = false) => {
    const button = event.currentTarget;

    // Get button dimensions and position
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    // Calculate ripple position
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    // Create ripple element
    const ripple = document.createElement('span');
    ripple.className = `ripple ${dark ? 'ripple-dark' : ''}`;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // Add ripple to button
    button.appendChild(ripple);

    // Remove ripple after animation
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }, []);

  return createRipple;
};

export default useRipple;
