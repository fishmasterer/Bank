import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for detecting long press gestures
 * Returns handlers for touch/mouse events and press state
 */
const useLongPress = (onLongPress, onClick, options = {}) => {
  const {
    delay = 500,           // Time to trigger long press
    movementThreshold = 10 // Max movement allowed during press
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const isLongPressTriggered = useRef(false);

  const start = useCallback((clientX, clientY) => {
    startPos.current = { x: clientX, y: clientY };
    isLongPressTriggered.current = false;
    setIsPressed(true);

    timeoutRef.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      onLongPress?.();
    }, delay);
  }, [onLongPress, delay]);

  const move = useCallback((clientX, clientY) => {
    if (!timeoutRef.current) return;

    const deltaX = Math.abs(clientX - startPos.current.x);
    const deltaY = Math.abs(clientY - startPos.current.y);

    // Cancel if moved too much
    if (deltaX > movementThreshold || deltaY > movementThreshold) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsPressed(false);
    }
  }, [movementThreshold]);

  const end = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsPressed(false);

    // Only trigger click if long press wasn't triggered
    if (!isLongPressTriggered.current) {
      onClick?.();
    }
  }, [onClick]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPressed(false);
    isLongPressTriggered.current = false;
  }, []);

  const handlers = {
    onTouchStart: (e) => {
      const touch = e.touches[0];
      start(touch.clientX, touch.clientY);
      // Prevent iOS magnifying glass by preventing default after a short delay
      // We don't prevent immediately to allow scrolling to still work
    },
    onTouchMove: (e) => {
      const touch = e.touches[0];
      move(touch.clientX, touch.clientY);
      // If we're in a potential long press state, prevent default to stop iOS behaviors
      if (timeoutRef.current) {
        e.preventDefault();
      }
    },
    onTouchEnd: (e) => {
      // Prevent default if long press was triggered to avoid any follow-up actions
      if (isLongPressTriggered.current) {
        e.preventDefault();
      }
      end();
    },
    onTouchCancel: cancel,
    onMouseDown: (e) => {
      start(e.clientX, e.clientY);
    },
    onMouseMove: (e) => {
      if (isPressed) {
        move(e.clientX, e.clientY);
      }
    },
    onMouseUp: end,
    onMouseLeave: cancel,
    onContextMenu: (e) => {
      // Prevent context menu on long press
      e.preventDefault();
    }
  };

  return {
    handlers,
    isPressed
  };
};

export default useLongPress;
