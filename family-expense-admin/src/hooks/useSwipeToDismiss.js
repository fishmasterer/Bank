import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for swipe-to-dismiss functionality on bottom sheets
 * Returns handlers and state for implementing swipe-down-to-close behavior
 */
const useSwipeToDismiss = (onDismiss, options = {}) => {
  const {
    threshold = 200,        // Distance to trigger dismiss (high for low sensitivity)
    velocityThreshold = 1.0, // Velocity to trigger dismiss (high for low sensitivity)
    resistance = 0.35,       // Resistance factor for overscroll (lower = harder to pull)
    minDragDistance = 30     // Minimum drag before considering dismiss
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

    // Only start drag if touching the top 80px of modal (drag handle area)
    const modalRect = modalContent.getBoundingClientRect();
    const touchY = touch.clientY - modalRect.top;
    if (touchY > 80) return; // Don't start drag if not in handle area

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
    // Must drag at least minDragDistance to prevent accidental dismisses
    // Then check either distance threshold or velocity threshold
    const shouldDismiss = deltaY >= minDragDistance &&
      (deltaY > threshold || velocity > velocityThreshold);

    if (shouldDismiss) {
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
  }, [isDragging, threshold, velocityThreshold, minDragDistance, onDismiss]);

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
