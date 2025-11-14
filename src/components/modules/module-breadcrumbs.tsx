'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleBreadcrumb } from '@/lib/modules/hierarchy-helpers'

interface ModuleBreadcrumbsProps {
  breadcrumbs: ModuleBreadcrumb[]
  baseUrl?: string // '/modules' or '/courses/[slug]'
  className?: string
  showHome?: boolean
}

export function ModuleBreadcrumbs({
  breadcrumbs,
  baseUrl = '/modules',
  className,
  showHome = true,
}: ModuleBreadcrumbsProps) {
  if (breadcrumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm overflow-x-auto', className)}
    >
      {/* Home link */}
      {showHome && (
        <>
          <Link
            href="/"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </>
      )}

      {/* Breadcrumb trail */}
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <div key={crumb.id} className="flex items-center gap-2 shrink-0">
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                {crumb.title}
              </span>
            ) : (
              <>
                <Link
                  href={`${baseUrl}/${crumb.slug}`}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {crumb.title}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </div>
        )
      })}
    </nav>
  )
}
