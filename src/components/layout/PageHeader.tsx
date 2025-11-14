"use client";

import Link from 'next/link';
import { ArrowLeft, Eye, Save, Users, Brain, Layers } from 'lucide-react';
import { NeuralButton } from '@/components/ui/neural-button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  /**
   * Page title (e.g., "Edit Module", "Create Course")
   */
  title: string;

  /**
   * Subtitle or description
   */
  subtitle?: string;

  /**
   * Back button link
   */
  backHref: string;

  /**
   * Back button label
   */
  backLabel?: string;

  /**
   * Preview link (optional)
   */
  previewHref?: string;

  /**
   * Number of collaborators (for team button badge)
   */
  collaboratorCount?: number;

  /**
   * Handler for team button click
   */
  onTeamClick?: () => void;

  /**
   * Handler for save button click
   */
  onSave?: () => void;

  /**
   * Whether save is in progress
   */
  isSaving?: boolean;

  /**
   * Whether save button is disabled
   */
  saveDisabled?: boolean;

  /**
   * Icon to display (brain for root modules, layers for submodules)
   */
  icon?: 'brain' | 'layers' | 'none';

  /**
   * Additional className
   */
  className?: string;
}

/**
 * Consistent page header for edit/create pages
 *
 * Features:
 * - Back button
 * - Title + subtitle
 * - Team button with collaborator count badge
 * - Preview button (optional)
 * - Save button
 * - Responsive layout
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  previewHref,
  collaboratorCount = 0,
  onTeamClick,
  onSave,
  isSaving = false,
  saveDisabled = false,
  icon = 'brain',
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Left Section - Back Button + Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link href={backHref}>
              <NeuralButton variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">{backLabel}</span>
              </NeuralButton>
            </Link>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Icon */}
              {icon !== 'none' && (
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-neural flex-shrink-0">
                  {icon === 'layers' ? (
                    <Layers className="h-6 w-6 text-primary-foreground" />
                  ) : (
                    <Brain className="h-6 w-6 text-primary-foreground" />
                  )}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-neural-primary truncate leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Team Button */}
            {onTeamClick && (
              <NeuralButton
                variant="ghost"
                size="sm"
                onClick={onTeamClick}
                className="relative min-h-[44px] min-w-[44px]"
                aria-label={`Team (${collaboratorCount} collaborators)`}
              >
                <Users className="h-4 w-4" />
                {collaboratorCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-neural-primary text-primary-foreground"
                  >
                    {collaboratorCount}
                  </Badge>
                )}
                <span className="hidden lg:inline ml-2">Team</span>
              </NeuralButton>
            )}

            {/* Preview Button */}
            {previewHref && (
              <Link href={previewHref}>
                <NeuralButton
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-600 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-all duration-200 hover:scale-105"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden lg:inline ml-2">Preview</span>
                </NeuralButton>
              </Link>
            )}

            {/* Save Button */}
            {onSave && (
              <NeuralButton
                variant="neural"
                size="sm"
                onClick={onSave}
                disabled={isSaving || saveDisabled}
                className="min-h-[44px] min-w-[44px] bg-[#FF6B35] hover:bg-[#E55A28] text-white font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Save className="h-4 w-4" />
                <span className="hidden md:inline ml-2">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </span>
              </NeuralButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
