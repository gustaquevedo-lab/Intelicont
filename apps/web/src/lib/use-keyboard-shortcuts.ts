"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  action: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        const matchKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchCtrl = shortcut.ctrlOrMeta ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const matchShift = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const matchAlt = shortcut.alt ? e.altKey : !e.altKey;

        if (matchKey && matchCtrl && matchShift && matchAlt) {
          if (shortcut.preventDefault !== false || !isInput) {
            if (shortcut.ctrlOrMeta || shortcut.alt || shortcut.shift) {
              e.preventDefault();
            }
          }
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

export function useShortcut(key: string, action: () => void, options: Omit<KeyboardShortcut, "key" | "action"> = {}) {
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const matchKey = e.key.toLowerCase() === key.toLowerCase();
      const matchCtrl = options.ctrlOrMeta ? (e.ctrlKey || e.metaKey) : true;
      const matchShift = options.shift ? e.shiftKey : true;
      const matchAlt = options.alt ? e.altKey : true;

      if (matchKey && matchCtrl && matchShift && matchAlt) {
        if (options.ctrlOrMeta || options.alt || options.shift) {
          e.preventDefault();
        }
        actionRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, options.ctrlOrMeta, options.shift, options.alt]);
}

export function useKey(key: string, action: () => void, enabled = true) {
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        actionRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, enabled]);
}
