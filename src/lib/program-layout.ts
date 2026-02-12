/**
 * Auto-layout algorithm for program map
 * Uses hierarchical layout based on prerequisite depth
 */

interface MinimalCourse {
  id: string;
  title: string;
  prerequisite_course_ids: string[];
}

type PositionedCourse<T extends MinimalCourse> = T & {
  program_position_x: number;
  program_position_y: number;
  depth: number; // Calculated prerequisite depth
};

/**
 * Calculate the depth of a course in the prerequisite graph
 * Depth = longest path from a course with no prerequisites to this course
 */
function calculateDepth<T extends MinimalCourse>(
  courseId: string,
  courses: T[],
  memo: Map<string, number> = new Map()
): number {
  // Check memo
  if (memo.has(courseId)) {
    return memo.get(courseId)!;
  }

  const course = courses.find(c => c.id === courseId);
  if (!course) return 0;

  // If no prerequisites, depth is 0
  if (!course.prerequisite_course_ids || course.prerequisite_course_ids.length === 0) {
    memo.set(courseId, 0);
    return 0;
  }

  // Depth is 1 + max depth of all prerequisites
  const prerequisiteDepths = course.prerequisite_course_ids.map(prereqId =>
    calculateDepth(prereqId, courses, memo)
  );

  const depth = 1 + Math.max(...prerequisiteDepths);
  memo.set(courseId, depth);
  return depth;
}

/**
 * Auto-layout courses using hierarchical layout algorithm
 * Groups courses by prerequisite depth and spreads them evenly
 */
export function autoLayoutCourses<T extends MinimalCourse>(courses: T[]): PositionedCourse<T>[] {
  // Calculate depth for each course
  const memo = new Map<string, number>();
  const coursesWithDepth = courses.map(course => ({
    ...course,
    depth: calculateDepth(course.id, courses, memo)
  }));

  // Group courses by depth
  const maxDepth = Math.max(...coursesWithDepth.map(c => c.depth), 0);
  const layers = new Map<number, typeof coursesWithDepth>();

  for (let i = 0; i <= maxDepth; i++) {
    layers.set(i, []);
  }

  coursesWithDepth.forEach(course => {
    layers.get(course.depth)!.push(course);
  });

  // Position courses
  const positioned: PositionedCourse<T>[] = [];

  layers.forEach((layerCourses, depth) => {
    if (layerCourses.length === 0) return;

    // Y position based on depth (10% to 90% range)
    const y = maxDepth === 0 ? 50 : 10 + (depth / maxDepth) * 75;

    // X positions spread evenly across width (15% to 85% range)
    const xRange = 70; // 15% to 85% = 70% usable width
    const xStart = 15;

    layerCourses.forEach((course, index) => {
      let x: number;

      if (layerCourses.length === 1) {
        // Single course: center it
        x = 50;
      } else {
        // Multiple courses: spread evenly
        x = xStart + (index / (layerCourses.length - 1)) * xRange;
      }

      positioned.push({
        ...course,
        program_position_x: parseFloat(x.toFixed(2)),
        program_position_y: parseFloat(y.toFixed(2))
      });
    });
  });

  return positioned;
}

/**
 * Detect if courses need auto-layout (most are at default position)
 */
export function needsAutoLayout<T extends MinimalCourse & { program_position_x?: number; program_position_y?: number }>(courses: T[]): boolean {
  if (courses.length === 0) return false;

  // Count courses at default position (50, 50)
  const defaultCount = courses.filter(
    c =>
      (c.program_position_x === null || c.program_position_x === 50) &&
      (c.program_position_y === null || c.program_position_y === 50)
  ).length;

  // If more than 50% are at default, suggest auto-layout
  return defaultCount > courses.length * 0.5;
}

/**
 * Validate prerequisite relationships (detect cycles)
 */
export function validatePrerequisites<T extends MinimalCourse>(courses: T[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for cycles using DFS
  function hasCycle(
    courseId: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    const course = courses.find(c => c.id === courseId);
    if (!course) return false;

    visited.add(courseId);
    recursionStack.add(courseId);

    for (const prereqId of course.prerequisite_course_ids || []) {
      if (!visited.has(prereqId)) {
        if (hasCycle(prereqId, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(prereqId)) {
        // Found a cycle
        errors.push(`Circular prerequisite detected involving course: ${course.title}`);
        return true;
      }
    }

    recursionStack.delete(courseId);
    return false;
  }

  const visited = new Set<string>();

  for (const course of courses) {
    if (!visited.has(course.id)) {
      hasCycle(course.id, visited, new Set());
    }
  }

  // Check for invalid prerequisite IDs
  const courseIds = new Set(courses.map(c => c.id));

  courses.forEach(course => {
    (course.prerequisite_course_ids || []).forEach(prereqId => {
      if (!courseIds.has(prereqId)) {
        errors.push(`Course "${course.title}" has invalid prerequisite ID: ${prereqId}`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
