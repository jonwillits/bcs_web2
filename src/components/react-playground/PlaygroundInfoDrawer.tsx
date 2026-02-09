'use client';

/**
 * PlaygroundInfoDrawer
 *
 * Slide-out drawer from the right side that displays playground metadata.
 * Handles missing fields gracefully - shows only what's available.
 */

import { useEffect } from 'react';
import Image from 'next/image';
import { X, User, Eye, Calendar, Tag, Package, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/types/react-playground';

interface PlaygroundInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  author?: {
    name: string;
    avatar?: string;
    university?: string;
  };
  stats?: {
    viewCount: number;
    createdAt: Date;
  };
  category?: string;
  dependencies?: string[];
  tags?: string[];
  isFeatured?: boolean;
}

export default function PlaygroundInfoDrawer({
  open,
  onClose,
  title,
  description,
  author,
  stats,
  category,
  dependencies,
  tags,
  isFeatured,
}: PlaygroundInfoDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Get category label
  const categoryLabel = category
    ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ||
      category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 transform transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 id="drawer-title" className="text-lg font-semibold text-white">
            About this Playground
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-65px)] space-y-6">
          {/* Title + Featured Badge */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white">{title}</h3>
              {isFeatured && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Author */}
          {author && (
            <div className="flex items-center gap-3">
              {author.avatar ? (
                <Image
                  src={author.avatar}
                  alt={author.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium text-white">{author.name}</p>
                {author.university && (
                  <p className="text-sm text-gray-400">{author.university}</p>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2" suppressHydrationWarning>
                <Eye className="h-4 w-4" />
                {stats.viewCount.toLocaleString()} views
              </span>
              <span className="flex items-center gap-2" suppressHydrationWarning>
                <Calendar className="h-4 w-4" />
                {new Date(stats.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Category */}
          {categoryLabel && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Category</p>
              <span className="px-3 py-1 bg-neural-primary/20 text-neural-primary rounded-full text-sm font-medium">
                {categoryLabel}
              </span>
            </div>
          )}

          {/* Description */}
          {description && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-gray-300 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {dependencies && dependencies.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Dependencies
              </p>
              <div className="flex flex-wrap gap-2">
                {dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs font-mono"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
