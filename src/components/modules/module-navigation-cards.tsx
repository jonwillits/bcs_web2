'use client'

import Link from 'next/link'
import { ArrowUp, ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface NavigationModule {
  id: string
  title: string
  slug: string
  description?: string | null
}

interface ModuleNavigationCardsProps {
  parentModule?: NavigationModule | null
  previousModule?: NavigationModule | null
  nextModule?: NavigationModule | null
  baseUrl?: string
  className?: string
}

export function ModuleNavigationCards({
  parentModule,
  previousModule,
  nextModule,
  baseUrl = '/modules',
  className,
}: ModuleNavigationCardsProps) {
  // Don't render if no navigation options available
  if (!parentModule && !previousModule && !nextModule) {
    return null
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {/* Up to Parent */}
      {parentModule ? (
        <NavigationCard
          title="Go Up"
          module={parentModule}
          icon={<ArrowUp className="h-5 w-5" />}
          href={`${baseUrl}/${parentModule.slug}`}
          variant="up"
        />
      ) : (
        <div className="hidden md:block" />
      )}

      {/* Previous Sibling */}
      {previousModule ? (
        <NavigationCard
          title="Previous"
          module={previousModule}
          icon={<ArrowLeft className="h-5 w-5" />}
          href={`${baseUrl}/${previousModule.slug}`}
          variant="previous"
        />
      ) : (
        <div className="hidden md:block" />
      )}

      {/* Next Sibling */}
      {nextModule ? (
        <NavigationCard
          title="Next"
          module={nextModule}
          icon={<ArrowRight className="h-5 w-5" />}
          href={`${baseUrl}/${nextModule.slug}`}
          variant="next"
        />
      ) : (
        <div className="hidden md:block" />
      )}
    </div>
  )
}

interface NavigationCardProps {
  title: string
  module: NavigationModule
  icon: React.ReactNode
  href: string
  variant: 'up' | 'previous' | 'next'
}

function NavigationCard({ title, module, icon, href, variant }: NavigationCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:shadow-lg hover:border-neural-primary/50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-2 rounded-lg shrink-0',
                variant === 'up' && 'bg-synapse-primary/10 text-synapse-primary',
                variant === 'previous' && 'bg-neural-primary/10 text-neural-primary',
                variant === 'next' && 'bg-cognition-teal/10 text-cognition-teal'
              )}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-muted-foreground mb-1">{title}</div>
              <CardTitle className="text-base line-clamp-2 group-hover:text-neural-primary transition-colors">
                {module.title}
              </CardTitle>
              {module.description && (
                <CardDescription className="line-clamp-2 mt-1 text-xs">
                  {module.description}
                </CardDescription>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-neural-primary transition-colors" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
