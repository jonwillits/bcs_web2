'use client';

import Link from 'next/link';
import { ChevronRight, Map as MapIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string; // If undefined, this is the current page (not clickable)
}

interface QuestBreadcrumbProps {
  items: BreadcrumbItem[];
  icon?: React.ReactNode;
}

export function QuestBreadcrumb({ items, icon }: QuestBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 text-blue-400">
          {icon}
        </div>
      )}

      {/* Breadcrumb items */}
      <div className="flex items-center gap-2 min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = !isLast && item.href;

          return (
            <div key={index} className="flex items-center gap-2 min-w-0">
              {isClickable ? (
                <Link
                  href={item.href}
                  className="text-slate-400 hover:text-blue-400 transition-colors truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`font-bold truncate ${
                    isLast ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Mobile-friendly breadcrumb that shows only back button + current page
 */
interface MobileBreadcrumbProps {
  backHref: string;
  currentLabel: string;
  icon?: React.ReactNode;
}

export function MobileBreadcrumb({ backHref, currentLabel, icon }: MobileBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {icon && (
        <div className="flex-shrink-0 text-blue-400">
          {icon}
        </div>
      )}
      <Link href={backHref} className="text-slate-400 hover:text-blue-400 transition-colors">
        ← Back
      </Link>
      <ChevronRight size={16} className="text-slate-600" />
      <span className="font-bold text-white truncate">{currentLabel}</span>
    </nav>
  );
}
