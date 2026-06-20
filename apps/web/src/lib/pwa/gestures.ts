"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  distance: number;
  initialDistance: number;
  isPinching: boolean;
}

export function useGestures(options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  swipeThreshold?: number;
}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    swipeThreshold = 80,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const state = useRef<TouchState | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        state.current = {
          startX: t.clientX,
          startY: t.clientY,
          startTime: Date.now(),
          distance: 0,
          initialDistance: 0,
          isPinching: false,
        };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        state.current = {
          startX: 0,
          startY: 0,
          startTime: Date.now(),
          distance: dist,
          initialDistance: dist,
          isPinching: true,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!state.current) return;

      if (e.touches.length === 2 && state.current.isPinching) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const newScale = dist / state.current.initialDistance;
        setScale(newScale);
        onPinch?.(newScale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!state.current) return;
      const now = Date.now();
      const duration = now - state.current.startTime;

      if (state.current.isPinching) {
        state.current = null;
        return;
      }

      const t = e.changedTouches[0];
      const dx = t.clientX - state.current.startX;
      const dy = t.clientY - state.current.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const distance = Math.hypot(dx, dy);

      // Tap detection
      if (distance < 10 && duration < 300) {
        onTap?.();
        state.current = null;
        return;
      }

      // Swipe detection (must be quick and long enough)
      if (duration < 500 && distance > swipeThreshold) {
        if (absX > absY) {
          if (dx > 0) onSwipeRight?.();
          else onSwipeLeft?.();
        } else {
          if (dy > 0) onSwipeDown?.();
          else onSwipeUp?.();
        }
      }

      state.current = null;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPinch, onTap, swipeThreshold]);

  return { ref, scale };
}

// ─── Haptics ─────────────────────────────────────────────────────────────

export type HapticPattern =
  | "success"
  | "warning"
  | "error"
  | "selection"
  | "tap"
  | "scan";

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  success: [10, 50, 30, 50, 80], // success melody
  warning: [50, 100, 50], // two short pulses
  error: [100, 50, 100, 50, 200], // error pattern
  selection: 10, // light tick
  tap: 15, // single tap
  scan: [5, 30, 5], // short scan feedback
};

export function haptic(pattern: HapticPattern = "tap"): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    // ignore
  }
}

export function useHaptic() {
  return haptic;
}

// ─── Pull to Refresh ─────────────────────────────────────────────────────

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const ref = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;
      if (window.scrollY > 0) {
        isPulling.current = false;
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        e.preventDefault();
        setPullDistance(Math.min(dy * 0.4, 100));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (pullDistance > 60) {
        setIsRefreshing(true);
        haptic("scan");
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, pullDistance]);

  return { ref, pullDistance, isRefreshing };
}
