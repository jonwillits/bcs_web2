"use client";

import { useState, useCallback, useEffect } from 'react';

export interface FloatingPanelState {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

/**
 * Hook to manage floating panel state (slide-out team panel, bottom sheets, etc.)
 *
 * Features:
 * - Open/close/toggle panel
 * - ESC key to close
 * - Body scroll lock when panel is open (optional)
 */
export function useFloatingPanel(options?: {
  defaultOpen?: boolean;
  lockScroll?: boolean;
}): FloatingPanelState {
  const [isOpen, setIsOpen] = useState(options?.defaultOpen ?? false);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Handle ESC key to close panel
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closePanel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closePanel]);

  // Lock body scroll when panel is open (optional, useful for modals/bottom sheets)
  useEffect(() => {
    if (options?.lockScroll && isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, options?.lockScroll]);

  return {
    isOpen,
    openPanel,
    closePanel,
    togglePanel,
  };
}
