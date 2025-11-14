'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NeuralButton } from '@/components/ui/neural-button'
import { ModuleTreeSidebar } from './module-tree-sidebar'
import { cn } from '@/lib/utils'
import type { ModuleTreeNode } from '@/lib/modules/tree-utils'

interface MobileModuleDrawerProps {
  tree: ModuleTreeNode[]
  currentModuleId?: string
  baseUrl: string
}

export function MobileModuleDrawer({
  tree,
  currentModuleId,
  baseUrl,
}: MobileModuleDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDrawer = () => setIsOpen(!isOpen)
  const closeDrawer = () => setIsOpen(false)

  return (
    <>
      {/* Menu Button - Fixed bottom-right */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <NeuralButton
          onClick={toggleDrawer}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg text-white"
        >
          <Menu className="h-6 w-6 text-white" />
          <span className="sr-only">Open module navigation</span>
        </NeuralButton>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-x-0 bottom-0 z-50 bg-background border-t rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Module Navigation</h2>
          <NeuralButton
            variant="outline"
            size="sm"
            onClick={closeDrawer}
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close navigation</span>
          </NeuralButton>
        </div>

        {/* Drawer Content */}
        <div className="h-[calc(85vh-60px)] overflow-hidden">
          <ModuleTreeSidebar
            tree={tree}
            currentModuleId={currentModuleId}
            baseUrl={baseUrl}
            showSearch={true}
          />
        </div>
      </div>
    </>
  )
}
