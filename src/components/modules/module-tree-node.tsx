'use client'

import { ChevronRight, ChevronDown, BookOpen, Layers, Circle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ModuleTreeNode } from '@/lib/modules/tree-utils'

interface ModuleTreeNodeProps {
  node: ModuleTreeNode
  currentModuleId?: string
  expandedNodes: Set<string>
  onToggle: (id: string) => void
  baseUrl: string // '/modules' or '/courses/[slug]'
  level?: number
}

export function ModuleTreeNodeComponent({
  node,
  currentModuleId,
  expandedNodes,
  onToggle,
  baseUrl,
  level = 0,
}: ModuleTreeNodeProps) {
  const isExpanded = expandedNodes.has(node.id)
  const isCurrent = node.id === currentModuleId
  const hasChildren = node.children.length > 0

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasChildren) {
      onToggle(node.id)
    }
  }

  // Determine icon based on depth and whether it has children
  const Icon = level === 0 ? BookOpen : hasChildren ? Layers : Circle

  // Determine numbering display
  const numberingDisplay = node.numbering ? `${node.numbering}. ` : ''

  return (
    <div className="w-full">
      <Link
        href={`${baseUrl}/${node.slug}`}
        className={cn(
          'group flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 hover:bg-neural-primary/10',
          isCurrent && 'bg-neural-primary/20 border-l-4 border-neural-primary font-semibold',
          !isCurrent && 'border-l-4 border-transparent'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {/* Expand/collapse chevron */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-neural-primary/20 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Icon */}
        <Icon
          className={cn(
            'h-4 w-4 flex-shrink-0',
            level === 0 && 'text-neural-primary',
            level === 1 && 'text-synapse-primary',
            level === 2 && 'text-cognition-teal',
            level >= 3 && 'text-muted-foreground',
            !hasChildren && 'h-3 w-3'
          )}
        />

        {/* Numbering + Title */}
        <span
          className={cn(
            'flex-1 truncate text-sm',
            level === 0 && 'font-bold text-base',
            level === 1 && 'font-semibold',
            level >= 3 && 'text-muted-foreground'
          )}
        >
          {numberingDisplay && (
            <span className="font-mono text-muted-foreground mr-1">{numberingDisplay}</span>
          )}
          {node.title}
        </span>

        {/* Current indicator */}
        {isCurrent && <div className="h-2 w-2 rounded-full bg-neural-primary" />}
      </Link>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <ModuleTreeNodeComponent
              key={child.id}
              node={child}
              currentModuleId={currentModuleId}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              baseUrl={baseUrl}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
