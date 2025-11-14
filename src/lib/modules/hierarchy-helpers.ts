/**
 * Module Hierarchy Helper Functions (Server-Side Only)
 *
 * Database-dependent utilities for building and navigating hierarchical module structures.
 * DO NOT import these in client components - use tree-utils.ts instead.
 */

import { prisma } from '@/lib/db'
import {
  buildModuleTree,
  generateModuleNumbering,
  applyNumberingToTree,
  type ModuleTreeNode,
} from './tree-utils'

// Re-export types and tree utilities for server components
export type { ModuleTreeNode } from './tree-utils'
export { buildModuleTree, generateModuleNumbering, applyNumberingToTree } from './tree-utils'

export interface ModuleBreadcrumb {
  id: string
  title: string
  slug: string
}

export interface ModuleSiblings {
  previous: {
    id: string
    title: string
    slug: string
  } | null
  next: {
    id: string
    title: string
    slug: string
  } | null
}

/**
 * Fetch full breadcrumb trail from root to current module
 */
export async function getModuleBreadcrumbs(moduleId: string): Promise<ModuleBreadcrumb[]> {
  const breadcrumbs: ModuleBreadcrumb[] = []
  let currentId: string | null = moduleId

  // Traverse up the tree to collect ancestors
  while (currentId) {
    const moduleData = await prisma.modules.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        title: true,
        slug: true,
        parent_module_id: true,
      },
    })

    if (!moduleData) break

    breadcrumbs.unshift({
      id: moduleData.id,
      title: moduleData.title,
      slug: moduleData.slug,
    })

    currentId = moduleData.parent_module_id
  }

  return breadcrumbs
}

/**
 * Fetch siblings (previous and next) at the same level
 */
export async function getModuleSiblings(moduleId: string): Promise<ModuleSiblings> {
  const currentModule = await prisma.modules.findUnique({
    where: { id: moduleId },
    select: {
      parent_module_id: true,
      sort_order: true,
    },
  })

  if (!currentModule) {
    return { previous: null, next: null }
  }

  // Find all siblings (modules with same parent)
  const siblings = await prisma.modules.findMany({
    where: {
      parent_module_id: currentModule.parent_module_id,
      status: 'published',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      sort_order: true,
    },
    orderBy: {
      sort_order: 'asc',
    },
  })

  const currentIndex = siblings.findIndex((m) => m.id === moduleId)

  return {
    previous: currentIndex > 0 ? siblings[currentIndex - 1] : null,
    next: currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null,
  }
}

// Tree building and numbering functions are now imported from tree-utils.ts

/**
 * Fetch entire module tree for a course
 */
export async function getCourseModuleTree(courseId: string): Promise<ModuleTreeNode[]> {
  // Fetch all modules in the course
  const courseModules = await prisma.course_modules.findMany({
    where: {
      course_id: courseId,
    },
    include: {
      modules: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          parent_module_id: true,
          sort_order: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      },
    },
    orderBy: {
      sort_order: 'asc',
    },
  })

  const modules = courseModules.map((cm) => cm.modules)

  // Build tree structure
  const tree = buildModuleTree(modules)

  // Generate and apply numbering
  const numbering = generateModuleNumbering(tree)
  applyNumberingToTree(tree, numbering)

  return tree
}

/**
 * Fetch module tree for a standalone module (root + all descendants)
 */
export async function getStandaloneModuleTree(moduleId: string): Promise<{
  tree: ModuleTreeNode[]
  rootId: string
}> {
  // First, find the root module by traversing up
  let rootId = moduleId
  let currentId: string | null = moduleId

  while (currentId) {
    const moduleData = await prisma.modules.findUnique({
      where: { id: currentId },
      select: { id: true, parent_module_id: true },
    })

    if (!moduleData) break

    rootId = moduleData.id
    currentId = moduleData.parent_module_id
  }

  // Now fetch all modules in this tree (descendants of root)
  const allModules = await fetchDescendants(rootId)

  // Build tree structure
  const tree = buildModuleTree(allModules)

  // Generate and apply numbering
  const numbering = generateModuleNumbering(tree)
  applyNumberingToTree(tree, numbering)

  return { tree, rootId }
}

/**
 * Recursively fetch all descendants of a module
 */
async function fetchDescendants(
  moduleId: string,
  collected: Array<{
    id: string
    title: string
    slug: string
    description: string | null
    parent_module_id: string | null
    sort_order: number
    status: string
    created_at: Date
    updated_at: Date
  }> = []
): Promise<
  Array<{
    id: string
    title: string
    slug: string
    description: string | null
    parent_module_id: string | null
    sort_order: number
    status: string
    created_at: Date
    updated_at: Date
  }>
> {
  // Fetch current module
  const currentModule = await prisma.modules.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      parent_module_id: true,
      sort_order: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  })

  if (!currentModule) return collected

  collected.push(currentModule)

  // Fetch children
  const children = await prisma.modules.findMany({
    where: {
      parent_module_id: moduleId,
      status: 'published',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      parent_module_id: true,
      sort_order: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  })

  // Recursively fetch descendants of each child
  for (const child of children) {
    await fetchDescendants(child.id, collected)
  }

  return collected
}

// Utility functions (findNodeInTree, getAncestorIds, flattenTree) are now in tree-utils.ts
// Re-export them for convenience
export { findNodeInTree, getAncestorIds, flattenTree } from './tree-utils'
