/**
 * Client-Safe Tree Utility Functions
 *
 * Pure TypeScript utilities for tree manipulation without database dependencies.
 * Safe to import in client components.
 */

export interface ModuleTreeNode {
  id: string
  title: string
  slug: string
  description: string | null
  parent_module_id: string | null
  sort_order: number
  status: string
  created_at: Date
  updated_at: Date
  children: ModuleTreeNode[]
  depth: number
  numbering: string
}

/**
 * Build hierarchical tree structure from flat array of modules
 */
export function buildModuleTree(
  modules: Array<{
    id: string
    title: string
    slug: string
    description: string | null
    parent_module_id: string | null
    sort_order: number
    status: string
    created_at: Date
    updated_at: Date
  }>,
  parentId: string | null = null,
  depth: number = 0
): ModuleTreeNode[] {
  const children = modules
    .filter((m) => m.parent_module_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)

  return children.map((moduleData) => ({
    ...moduleData,
    children: buildModuleTree(modules, moduleData.id, depth + 1),
    depth,
    numbering: '', // Will be set by generateModuleNumbering
  }))
}

/**
 * Generate hierarchical numbering for tree nodes (1, 1.1, 1.2, 1.2.1, etc.)
 */
export function generateModuleNumbering(
  tree: ModuleTreeNode[],
  prefix: string = ''
): Map<string, string> {
  const numbering = new Map<string, string>()

  tree.forEach((node, index) => {
    const number = prefix ? `${prefix}.${index + 1}` : `${index + 1}`
    numbering.set(node.id, number)

    if (node.children.length > 0) {
      const childNumbering = generateModuleNumbering(node.children, number)
      childNumbering.forEach((value, key) => {
        numbering.set(key, value)
      })
    }
  })

  return numbering
}

/**
 * Apply numbering to tree nodes (mutates tree)
 */
export function applyNumberingToTree(
  tree: ModuleTreeNode[],
  numbering: Map<string, string>
): void {
  tree.forEach((node) => {
    node.numbering = numbering.get(node.id) || ''
    if (node.children.length > 0) {
      applyNumberingToTree(node.children, numbering)
    }
  })
}

/**
 * Find a node in the tree by ID
 */
export function findNodeInTree(
  tree: ModuleTreeNode[],
  nodeId: string
): ModuleTreeNode | null {
  for (const node of tree) {
    if (node.id === nodeId) return node

    const found = findNodeInTree(node.children, nodeId)
    if (found) return found
  }

  return null
}

/**
 * Get all ancestor IDs for a module (for auto-expanding tree)
 */
export function getAncestorIds(tree: ModuleTreeNode[], targetId: string): string[] {
  const ancestors: string[] = []

  function traverse(nodes: ModuleTreeNode[], path: string[]): boolean {
    for (const node of nodes) {
      const currentPath = [...path, node.id]

      if (node.id === targetId) {
        ancestors.push(...path)
        return true
      }

      if (traverse(node.children, currentPath)) {
        return true
      }
    }
    return false
  }

  traverse(tree, [])
  return ancestors
}

/**
 * Flatten tree to array (for search)
 */
export function flattenTree(tree: ModuleTreeNode[]): ModuleTreeNode[] {
  const flattened: ModuleTreeNode[] = []

  function traverse(nodes: ModuleTreeNode[]) {
    for (const node of nodes) {
      flattened.push(node)
      if (node.children.length > 0) {
        traverse(node.children)
      }
    }
  }

  traverse(tree)
  return flattened
}
