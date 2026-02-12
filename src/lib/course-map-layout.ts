/**
 * Course Map Layout Utilities
 *
 * Handles auto-layout algorithm and validation for module course maps.
 * Similar to program-layout but for modules instead of courses.
 */

// Base interface with required fields for layout calculations
export interface LayoutModule {
  id: string;
  title: string;
  prerequisite_module_ids: string[];
  course_map_position_x: number;
  course_map_position_y: number;
}

// For internal use with depth calculation - using type alias with intersection
type ModuleWithDepth<T extends LayoutModule> = T & {
  depth: number;
}

/**
 * Check if modules need auto-layout
 * Returns true if any module has default positioning (50, 50) or if there are overlaps
 */
export function needsAutoLayout<T extends LayoutModule>(modules: T[]): boolean {
  if (modules.length === 0) return false;

  // Check if any module is at default position (50, 50)
  const hasDefaultPositions = modules.some(
    module => module.course_map_position_x === 50 && module.course_map_position_y === 50
  );

  if (hasDefaultPositions) return true;

  // Check for overlapping modules (within 10% distance)
  for (let i = 0; i < modules.length; i++) {
    for (let j = i + 1; j < modules.length; j++) {
      const dx = modules[i].course_map_position_x - modules[j].course_map_position_x;
      const dy = modules[i].course_map_position_y - modules[j].course_map_position_y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 10) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate depth (level) of each module in the dependency tree
 */
function calculateDepths<T extends LayoutModule>(modules: T[]): Map<string, number> {
  const depths = new Map<string, number>();
  const visited = new Set<string>();

  function getDepth(moduleId: string): number {
    if (depths.has(moduleId)) {
      return depths.get(moduleId)!;
    }

    if (visited.has(moduleId)) {
      // Circular dependency detected - return 0 to break the cycle
      return 0;
    }

    visited.add(moduleId);

    const currentModule = modules.find(m => m.id === moduleId);
    if (!currentModule || currentModule.prerequisite_module_ids.length === 0) {
      depths.set(moduleId, 0);
      visited.delete(moduleId);
      return 0;
    }

    const prereqDepths = currentModule.prerequisite_module_ids.map(prereqId => getDepth(prereqId));
    const maxPrereqDepth = Math.max(...prereqDepths, -1);
    const depth = maxPrereqDepth + 1;

    depths.set(moduleId, depth);
    visited.delete(moduleId);
    return depth;
  }

  modules.forEach(module => getDepth(module.id));
  return depths;
}

/**
 * Auto-layout modules in a hierarchical structure
 * Returns modules with updated positions
 */
export function autoLayoutModules<T extends LayoutModule>(modules: T[]): ModuleWithDepth<T>[] {
  if (modules.length === 0) return [];

  const depths = calculateDepths(modules);
  const maxDepth = Math.max(...Array.from(depths.values()), 0);

  // Group modules by depth
  const modulesByDepth: ModuleWithDepth<T>[][] = [];
  for (let d = 0; d <= maxDepth; d++) {
    modulesByDepth[d] = [];
  }

  modules.forEach(mod => {
    const depth = depths.get(mod.id) || 0;
    modulesByDepth[depth].push({ ...mod, depth } as ModuleWithDepth<T>);
  });

  // Calculate positions
  const result: ModuleWithDepth<T>[] = [];
  const horizontalSpacing = 100 / (maxDepth + 2); // Spacing between depth levels

  modulesByDepth.forEach((modulesAtDepth, depth) => {
    const verticalSpacing = 100 / (modulesAtDepth.length + 1);

    modulesAtDepth.forEach((mod, index) => {
      result.push({
        ...mod,
        course_map_position_x: horizontalSpacing * (depth + 1),
        course_map_position_y: verticalSpacing * (index + 1),
        depth
      } as ModuleWithDepth<T>);
    });
  });

  return result;
}

/**
 * Validate prerequisite relationships
 * Returns validation result with any errors found
 */
export function validatePrerequisites<T extends LayoutModule>(modules: T[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const moduleIds = new Set(modules.map(m => m.id));

  // Check for invalid prerequisite IDs
  modules.forEach(module => {
    module.prerequisite_module_ids.forEach(prereqId => {
      if (!moduleIds.has(prereqId)) {
        errors.push(
          `Module "${module.title}" references non-existent prerequisite ID: ${prereqId}`
        );
      }
    });
  });

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCircularDependency(moduleId: string, path: string[] = []): boolean {
    if (recursionStack.has(moduleId)) {
      const cycle = [...path, moduleId].slice(path.indexOf(moduleId));
      const cycleTitles = cycle
        .map(id => modules.find(m => m.id === id)?.title || id)
        .join(' → ');
      errors.push(`Circular dependency detected: ${cycleTitles}`);
      return true;
    }

    if (visited.has(moduleId)) {
      return false;
    }

    const currentModule = modules.find(m => m.id === moduleId);
    if (!currentModule) return false;

    visited.add(moduleId);
    recursionStack.add(moduleId);

    for (const prereqId of currentModule.prerequisite_module_ids) {
      if (hasCircularDependency(prereqId, [...path, moduleId])) {
        recursionStack.delete(moduleId);
        return true;
      }
    }

    recursionStack.delete(moduleId);
    return false;
  }

  modules.forEach(module => {
    if (!visited.has(module.id)) {
      hasCircularDependency(module.id);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
