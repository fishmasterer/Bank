import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect scroll direction
 * Returns 'up' when scrolling up, 'down' when scrolling down
 * Includes threshold to prevent jitter
 */
const useScrollDirection = (threshold = 10) => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY.current ? 'down' : 'up';

      // Only update if we've scrolled past threshold
      if (Math.abs(scrollY - lastScrollY.current) >= threshold) {
        setScrollDirection(direction);
        lastScrollY.current = scrollY;
      }

      // Check if at top of page
      setIsAtTop(scrollY < 10);
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Set initial values
    lastScrollY.current = window.scrollY;
    setIsAtTop(window.scrollY < 10);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return { scrollDirection, isAtTop };
};

export default useScrollDirection;
