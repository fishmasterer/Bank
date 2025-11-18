import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for shared element transitions
 * Creates smooth animations when transitioning between views
 */
const useSharedElementTransition = () => {
  const [transitionState, setTransitionState] = useState({
    isActive: false,
    sourceRect: null,
    targetElement: null
  });

  const sourceRef = useRef(null);

  // Capture the source element's position before transition
  const captureSource = useCallback((element) => {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    };
  }, []);

  // Start transition from source element
  const startTransition = useCallback((sourceElement) => {
    const rect = captureSource(sourceElement);
    if (!rect) return;

    sourceRef.current = sourceElement;

    setTransitionState({
      isActive: true,
      sourceRect: rect,
      targetElement: null
    });
  }, [captureSource]);

  // End transition and reset state
  const endTransition = useCallback(() => {
    setTransitionState({
      isActive: false,
      sourceRect: null,
      targetElement: null
    });
    sourceRef.current = null;
  }, []);

  // Get animation styles for the transitioning element
  const getTransitionStyles = useCallback((isEntering = true) => {
    if (!transitionState.sourceRect) {
      return {};
    }

    const { sourceRect } = transitionState;

    if (isEntering) {
      // Starting position (from source)
      return {
        '--shared-origin-x': `${sourceRect.left + sourceRect.width / 2}px`,
        '--shared-origin-y': `${sourceRect.top + sourceRect.height / 2}px`,
        '--shared-width': `${sourceRect.width}px`,
        '--shared-height': `${sourceRect.height}px`
      };
    }

    return {};
  }, [transitionState]);

  return {
    transitionState,
    startTransition,
    endTransition,
    getTransitionStyles,
    sourceRef,
    isTransitioning: transitionState.isActive
  };
};

export default useSharedElementTransition;
