import { useRef, useCallback } from 'react';

/**
 * Custom hook for detecting swipe gestures
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback when swiping left
 * @param {Function} options.onSwipeRight - Callback when swiping right
 * @param {number} options.threshold - Minimum distance to trigger swipe (default: 50)
 * @param {number} options.velocityThreshold - Minimum velocity to trigger swipe (default: 0.3)
 * @returns {Object} Touch event handlers
 */
const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  velocityThreshold = 0.3
} = {}) => {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchMoveRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current.time) return;

    const touch = e.touches[0];
    touchMoveRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Check if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current.time) return;

    const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
    const deltaY = touchMoveRef.current.y - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Calculate velocity (pixels per millisecond)
    const velocity = Math.abs(deltaX) / deltaTime;

    // Check if swipe was mostly horizontal
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    // Determine if swipe meets threshold
    const meetsThreshold = Math.abs(deltaX) > threshold || velocity > velocityThreshold;

    if (isHorizontal && meetsThreshold && isSwipingRef.current) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset
    touchStartRef.current = { x: 0, y: 0, time: 0 };
    isSwipingRef.current = false;
  }, [onSwipeLeft, onSwipeRight, threshold, velocityThreshold]);

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = { x: 0, y: 0, time: 0 };
    isSwipingRef.current = false;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };
};

export default useSwipeGesture;
