"use client";

import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export interface MediaSidebarProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

/**
 * Collapsible media sidebar for desktop layout
 *
 * Features:
 * - Collapsible/expandable
 * - Smooth animations
 * - Remembers state
 * - Fixed width when expanded
 */
export function MediaSidebar({
  children,
  defaultCollapsed = true,
  className,
}: MediaSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={cn(
        "relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-80",
        className
      )}
    >
      {/* Collapsed State - Icon Button */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center justify-center w-12 h-32 bg-background border border-border rounded-lg shadow-lg hover:bg-muted transition-colors group"
          aria-label="Expand media library"
        >
          <ImageIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-2" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground writing-mode-vertical-rl">
            Media
          </span>
          <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground mt-2" />
        </button>
      )}

      {/* Expanded State - Full Sidebar */}
      {!isCollapsed && (
        <Card className="fixed right-4 top-20 bottom-4 w-80 overflow-hidden shadow-lg z-[60]">
          {/* Header with Collapse Button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-sm text-foreground">Media Library</h3>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
              aria-label="Collapse media library"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-[calc(100%-57px)]">
            {children}
          </div>
        </Card>
      )}
    </div>
  );
}
