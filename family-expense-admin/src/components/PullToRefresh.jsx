import React, { useState, useRef, useCallback } from 'react';
import './PullToRefresh.css';

const PullToRefresh = ({ onRefresh, children, disabled = false }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const threshold = 80; // Distance needed to trigger refresh
  const maxPull = 120; // Maximum pull distance

  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only start pull if at the top of scroll
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || disabled || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0) {
      // Apply resistance to make it feel natural
      const resistedDistance = Math.min(distance * 0.5, maxPull);
      setPullDistance(resistedDistance);

      // Prevent default scrolling when pulling
      if (resistedDistance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullDistance >= threshold && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, onRefresh, disabled]);

  const getIndicatorStyle = () => {
    const progress = Math.min(pullDistance / threshold, 1);
    return {
      transform: `translateY(${pullDistance - 60}px) rotate(${progress * 360}deg)`,
      opacity: progress,
    };
  };

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="pull-to-refresh-indicator" style={getIndicatorStyle()}>
        {isRefreshing ? (
          <div className="refresh-spinner" />
        ) : (
          <div className={`refresh-arrow ${pullDistance >= threshold ? 'ready' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
        )}
      </div>

      <div
        className="pull-to-refresh-content"
        style={{
          transform: isPulling && pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'translateY(0)',
        }}
      >
        {children}
      </div>

      {pullDistance >= threshold && !isRefreshing && (
        <div className="pull-release-hint">Release to refresh</div>
      )}
    </div>
  );
};

export default PullToRefresh;
