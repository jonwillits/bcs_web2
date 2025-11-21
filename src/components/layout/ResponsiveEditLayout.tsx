"use client";

import { ReactNode, useState } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useFloatingPanel } from '@/hooks/useFloatingPanel';
import { PageHeader, PageHeaderProps } from './PageHeader';
import { FloatingTeamPanel } from './FloatingTeamPanel';
import { MobileBottomSheet } from './MobileBottomSheet';
import { MediaSidebar } from './MediaSidebar';
import { cn } from '@/lib/utils';

export interface ResponsiveEditLayoutProps {
  /**
   * Page header props
   */
  header: Omit<PageHeaderProps, 'onTeamClick'>;

  /**
   * Content for Edit tab (rich text editor + content)
   */
  editTabContent: ReactNode;

  /**
   * Content for Settings tab (module details, publishing options)
   */
  settingsTabContent: ReactNode;

  /**
   * Content for Team panel/sheet (collaborators + activity feed)
   */
  teamContent: ReactNode;

  /**
   * Content for Media sidebar/sheet (media library)
   */
  mediaContent: ReactNode;

  /**
   * Default active tab
   */
  defaultTab?: 'edit' | 'settings';

  /**
   * Additional className for main container
   */
  className?: string;
}

/**
 * Responsive layout wrapper for edit/create pages
 *
 * Layout by breakpoint:
 * - Desktop (>= 1280px): Two tabs + floating team panel + media sidebar
 * - Tablet (768-1279px): Two tabs + team bottom sheet + media bottom sheet
 * - Mobile (< 768px): Two tabs + team bottom sheet + media bottom sheet
 *
 * Features:
 * - Automatic responsive behavior
 * - Consistent team panel/sheet across breakpoints
 * - Media integration (sidebar on desktop, sheet on mobile)
 * - Shared state management
 */
export function ResponsiveEditLayout({
  header,
  editTabContent,
  settingsTabContent,
  teamContent,
  mediaContent,
  defaultTab = 'edit',
  className,
}: ResponsiveEditLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  const teamPanel = useFloatingPanel({ lockScroll: isMobile || isTablet });
  const mediaSheet = useFloatingPanel({ lockScroll: isMobile || isTablet });

  const [activeTab, setActiveTab] = useState<'edit' | 'settings'>(defaultTab);

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header with Team Button */}
      <PageHeader
        {...header}
        onTeamClick={teamPanel.togglePanel}
      />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Elegant Underline Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6 sm:gap-8">
            <button
              onClick={() => setActiveTab('edit')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                activeTab === 'edit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>

        {/* Edit Tab Content */}
        {activeTab === 'edit' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Editor Area */}
              <div className="lg:col-span-9">
                {editTabContent}
              </div>

              {/* Media Sidebar (Desktop Only) */}
              {isDesktop && (
                <div className="lg:col-span-3">
                  <MediaSidebar>
                    {mediaContent}
                  </MediaSidebar>
                </div>
              )}
            </div>

            {/* Media Button for Mobile/Tablet */}
            {(isMobile || isTablet) && (
              <div className="fixed bottom-20 right-4 z-30">
                <button
                  onClick={mediaSheet.openPanel}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-neural-primary text-primary-foreground shadow-lg hover:bg-neural-primary/90 transition-all hover:scale-110"
                  aria-label="Open media library"
                >
                  📷
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto">
            {settingsTabContent}
          </div>
        )}
      </main>

      {/* Team Panel (Desktop) or Bottom Sheet (Mobile/Tablet) */}
      {isDesktop ? (
        <FloatingTeamPanel
          isOpen={teamPanel.isOpen}
          onClose={teamPanel.closePanel}
          width="420px"
        >
          {teamContent}
        </FloatingTeamPanel>
      ) : (
        <MobileBottomSheet
          isOpen={teamPanel.isOpen}
          onClose={teamPanel.closePanel}
          title="Team & Activity"
          height="85vh"
        >
          {teamContent}
        </MobileBottomSheet>
      )}

      {/* Media Bottom Sheet (Mobile/Tablet) */}
      {(isMobile || isTablet) && (
        <MobileBottomSheet
          isOpen={mediaSheet.isOpen}
          onClose={mediaSheet.closePanel}
          title="Media Library"
          height="85vh"
        >
          {mediaContent}
        </MobileBottomSheet>
      )}
    </div>
  );
}
