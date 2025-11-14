"use client";

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /**
   * Height of the sheet when expanded
   * @default '80vh'
   */
  height?: string;
}

/**
 * Mobile-optimized bottom sheet component
 *
 * Features:
 * - Slides up from bottom
 * - Backdrop overlay
 * - Drag handle for visual affordance
 * - ESC key support (handled by parent)
 * - Auto-focus trap
 */
export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  height = '80vh',
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Trap focus within sheet when open
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      const focusableElements = sheetRef.current.querySelectorAll(
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

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[60] bg-background rounded-t-2xl shadow-2xl",
          "animate-in slide-in-from-bottom duration-300",
          className
        )}
        style={{ height }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
          <h2
            id="bottom-sheet-title"
            className="text-lg font-semibold text-foreground"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
            aria-label="Close sheet"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4" style={{ height: 'calc(100% - 80px)' }}>
          {children}
        </div>
      </div>
    </>
  );
}
