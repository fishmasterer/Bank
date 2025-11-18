import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for swipe-to-dismiss functionality on bottom sheets
 * Returns handlers and state for implementing swipe-down-to-close behavior
 */
const useSwipeToDismiss = (onDismiss, options = {}) => {
  const {
    threshold = 100,        // Distance to trigger dismiss
    velocityThreshold = 0.5, // Velocity to trigger dismiss
    resistance = 0.4        // Resistance factor for overscroll
  } = options;

  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startY = useRef(0);
  const startTime = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    // Only start if touching near the top (drag handle area)
    const touch = e.touches[0];
    const target = e.target;
    const modalContent = target.closest('.modal-content');

    if (!modalContent) return;

    // Check if we're at the top of the scroll container
    const scrollTop = modalContent.scrollTop || 0;
    if (scrollTop > 5) return; // Don't start drag if scrolled down

    startY.current = touch.clientY;
    startTime.current = Date.now();
    currentY.current = touch.clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;
    currentY.current = touch.clientY;

    // Only allow dragging down
    if (deltaY < 0) {
      setTranslateY(0);
      return;
    }

    // Apply resistance for natural feel
    const resistedDelta = deltaY * resistance;
    setTranslateY(resistedDelta);

    // Prevent scroll while dragging
    if (deltaY > 10) {
      e.preventDefault();
    }
  }, [isDragging, resistance]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    const deltaY = currentY.current - startY.current;
    const deltaTime = Date.now() - startTime.current;
    const velocity = deltaY / deltaTime;

    setIsDragging(false);

    // Check if should dismiss
    if (deltaY > threshold || velocity > velocityThreshold) {
      // Animate out
      setTranslateY(window.innerHeight);
      setTimeout(() => {
        onDismiss();
        setTranslateY(0);
      }, 300);
    } else {
      // Snap back
      setTranslateY(0);
    }
  }, [isDragging, threshold, velocityThreshold, onDismiss]);

  const handleTouchCancel = useCallback(() => {
    setIsDragging(false);
    setTranslateY(0);
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    },
    style: {
      transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
      transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
    },
    isDragging,
    translateY
  };
};

export default useSwipeToDismiss;
