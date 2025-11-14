"use client";

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FloatingTeamPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /**
   * Width of the panel when expanded
   * @default '400px'
   */
  width?: string;
}

/**
 * Floating team panel that slides in from the right
 *
 * Features:
 * - Slides in from right side
 * - Backdrop overlay
 * - ESC key support (handled by parent)
 * - Auto-focus trap
 * - Responsive width
 */
export function FloatingTeamPanel({
  isOpen,
  onClose,
  children,
  className,
  width = '400px',
}: FloatingTeamPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Trap focus within panel when open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);

      // Focus first element
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTab);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[55] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[60] bg-background shadow-2xl",
          "animate-in slide-in-from-right duration-300",
          "border-l border-border",
          className
        )}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2
            id="team-panel-title"
            className="text-lg font-semibold text-foreground"
          >
            Team & Activity
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
            aria-label="Close team panel"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto h-[calc(100vh-73px)] p-6">
          {children}
        </div>
      </div>
    </>
  );
}
