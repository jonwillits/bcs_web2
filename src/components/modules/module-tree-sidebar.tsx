'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, ChevronsRight, ChevronsDown, X } from 'lucide-react'
import { ModuleTreeNodeComponent } from './module-tree-node'
import { getAncestorIds, flattenTree, type ModuleTreeNode } from '@/lib/modules/tree-utils'
import { Input } from '@/components/ui/input'
import { NeuralButton } from '@/components/ui/neural-button'
import { cn } from '@/lib/utils'

interface ModuleTreeSidebarProps {
  tree: ModuleTreeNode[]
  currentModuleId?: string
  baseUrl: string // '/modules' or '/courses/[slug]'
  className?: string
  showSearch?: boolean
}

export function ModuleTreeSidebar({
  tree,
  currentModuleId,
  baseUrl,
  className,
  showSearch = true,
}: ModuleTreeSidebarProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Auto-expand path to current module on mount
  useEffect(() => {
    if (currentModuleId && tree.length > 0) {
      const ancestors = getAncestorIds(tree, currentModuleId)
      setExpandedNodes(new Set([...ancestors, currentModuleId]))

      // Scroll to current module after a brief delay
      setTimeout(() => {
        const currentElement = document.querySelector('[data-current-module="true"]')
        if (currentElement) {
          currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [currentModuleId, tree])

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree

    const query = searchQuery.toLowerCase()
    const flatNodes = flattenTree(tree)
    const matchingNodes = flatNodes.filter(
      (node) =>
        node.title.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query) ||
        node.numbering.includes(query)
    )

    // If searching, expand all matching nodes and their ancestors
    const nodesToExpand = new Set<string>()
    matchingNodes.forEach((node) => {
      const ancestors = getAncestorIds(tree, node.id)
      ancestors.forEach((id) => nodesToExpand.add(id))
      nodesToExpand.add(node.id)
    })

    setExpandedNodes(nodesToExpand)

    return tree // Return full tree but with expanded state set
  }, [searchQuery, tree])

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = flattenTree(tree).map((node) => node.id)
    setExpandedNodes(new Set(allIds))
  }

  const collapseAll = () => {
    // Keep current module's ancestors expanded
    if (currentModuleId) {
      const ancestors = getAncestorIds(tree, currentModuleId)
      setExpandedNodes(new Set(ancestors))
    } else {
      setExpandedNodes(new Set())
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">MODULE NAVIGATION</h3>

        {/* Search */}
        {showSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Expand/Collapse controls */}
        <div className="flex gap-2">
          <NeuralButton
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="flex-1 h-8 text-xs"
          >
            <ChevronsDown className="h-3 w-3 mr-1" />
            Expand All
          </NeuralButton>
          <NeuralButton
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="flex-1 h-8 text-xs"
          >
            <ChevronsRight className="h-3 w-3 mr-1" />
            Collapse
          </NeuralButton>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {filteredTree.length > 0 ? (
          filteredTree.map((node) => (
            <ModuleTreeNodeComponent
              key={node.id}
              node={node}
              currentModuleId={currentModuleId}
              expandedNodes={expandedNodes}
              onToggle={toggleNode}
              baseUrl={baseUrl}
            />
          ))
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No modules found
          </div>
        )}
      </div>

      {/* Footer - Module count */}
      {!searchQuery && (
        <div className="px-4 py-3 border-t text-xs text-muted-foreground">
          {flattenTree(tree).length} modules total
        </div>
      )}
    </div>
  )
}
