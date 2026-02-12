/**
 * Rename Validation Script
 *
 * Verifies that all "Quest Map" → "Course Map" and "Curriculum Map" → "Program Map"
 * renames have been applied correctly across the codebase.
 *
 * Run: npx tsx scripts/test-rename-validation.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const SCRIPTS = path.join(ROOT, 'scripts');

const EXCLUDED_DIRS = ['node_modules', '.git', '.next', 'prisma/migrations'];

let errors: string[] = [];
let warnings: string[] = [];

// ============================================================
// 1. Scan for stale references in source files
// ============================================================

function scanForStaleReferences() {
  console.log('\n--- Scanning for stale references ---');

  const stalePatterns = [
    { pattern: /QuestMap/g, description: 'QuestMap (component/type name)' },
    { pattern: /quest-map/g, description: 'quest-map (file path/URL)' },
    { pattern: /quest_map_position/g, description: 'quest_map_position (old DB column)' },
    { pattern: /CurriculumMap/g, description: 'CurriculumMap (component/type name)' },
    { pattern: /\/curriculum\//g, description: '/curriculum/ (URL path)' },
    { pattern: /curriculum_position/g, description: 'curriculum_position (old DB column)' },
    { pattern: /\/faculty\/quest-map/g, description: '/faculty/quest-map (route)' },
    { pattern: /\/api\/faculty\/quest-map/g, description: '/api/faculty/quest-map (API route)' },
    { pattern: /\/api\/curriculum\//g, description: '/api/curriculum/ (API route)' },
    { pattern: /\/faculty\/curriculum/g, description: '/faculty/curriculum (route)' },
  ];

  const extensions = ['.ts', '.tsx', '.css'];

  function walkDir(dir: string) {
    if (EXCLUDED_DIRS.some(excl => dir.includes(excl))) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(ROOT, fullPath);

        for (const { pattern, description } of stalePatterns) {
          // Reset regex lastIndex
          pattern.lastIndex = 0;
          const matches = content.match(pattern);
          if (matches) {
            errors.push(`STALE: ${relativePath} contains "${description}" (${matches.length} occurrence(s))`);
          }
        }
      }
    }
  }

  walkDir(SRC);
  walkDir(SCRIPTS);

  // Exclude this validation script itself
  errors = errors.filter(e => !e.includes('test-rename-validation.ts'));
}

// ============================================================
// 2. Verify directory structure
// ============================================================

function verifyDirectories() {
  console.log('\n--- Verifying directory structure ---');

  const shouldExist = [
    'src/components/course-map',
    'src/components/program-map',
    'src/components/faculty/CourseMapEditor.tsx',
    'src/components/faculty/ProgramMapEditor.tsx',
    'src/lib/course-map-layout.ts',
    'src/lib/program-layout.ts',
    'src/app/faculty/course-map',
    'src/app/faculty/program',
    'src/app/program/map',
    'src/app/api/faculty/course-map',
    'src/app/api/faculty/program',
    'src/app/api/courses/by-slug/[slug]/course-map',
    'src/app/api/program/map',
  ];

  const shouldNotExist = [
    'src/components/quest-map',
    'src/components/curriculum',
    'src/components/faculty/QuestMapEditor.tsx',
    'src/components/faculty/CurriculumMapEditor.tsx',
    'src/lib/quest-map-layout.ts',
    'src/lib/curriculum-layout.ts',
    'src/app/faculty/quest-map',
    'src/app/curriculum',
    'src/app/api/faculty/quest-map',
    'src/app/api/curriculum',
    'src/app/api/courses/by-slug/[slug]/quest-map',
  ];

  for (const p of shouldExist) {
    const fullPath = path.join(ROOT, p);
    if (!fs.existsSync(fullPath)) {
      errors.push(`MISSING: ${p} should exist but does not`);
    } else {
      console.log(`  OK: ${p} exists`);
    }
  }

  for (const p of shouldNotExist) {
    const fullPath = path.join(ROOT, p);
    if (fs.existsSync(fullPath)) {
      errors.push(`STALE DIR: ${p} should NOT exist but still does`);
    } else {
      console.log(`  OK: ${p} correctly removed`);
    }
  }
}

// ============================================================
// 3. Verify new references exist in source files
// ============================================================

function verifyNewReferences() {
  console.log('\n--- Verifying new references ---');

  const expectedPatterns = [
    { file: 'src/components/course-map/CourseMapAuthenticated.tsx', pattern: /export function CourseMapAuthenticated/ },
    { file: 'src/components/course-map/CourseMapPublic.tsx', pattern: /export function CourseMapPublic/ },
    { file: 'src/components/program-map/ProgramMapAuthenticated.tsx', pattern: /export function ProgramMapAuthenticated/ },
    { file: 'src/components/program-map/ProgramMapPublic.tsx', pattern: /export function ProgramMapPublic/ },
    { file: 'src/components/faculty/CourseMapEditor.tsx', pattern: /export function CourseMapEditor/ },
    { file: 'src/components/faculty/ProgramMapEditor.tsx', pattern: /export function ProgramMapEditor/ },
    { file: 'src/app/api/faculty/course-map/layout/route.ts', pattern: /course_map_position_x/ },
    { file: 'src/app/api/faculty/program/layout/route.ts', pattern: /program_position_x/ },
  ];

  for (const { file, pattern } of expectedPatterns) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`MISSING FILE: ${file}`);
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (!pattern.test(content)) {
      errors.push(`MISSING PATTERN: ${file} does not contain expected pattern ${pattern}`);
    } else {
      console.log(`  OK: ${file} has correct exports/fields`);
    }
  }
}

// ============================================================
// 4. Check link consistency (href= and fetch( calls)
// ============================================================

function checkLinkConsistency() {
  console.log('\n--- Checking link consistency ---');

  const oldUrls = [
    '/faculty/quest-map',
    '/api/faculty/quest-map',
    '/curriculum/map',
    '/api/curriculum/',
    '/faculty/curriculum',
    '/api/faculty/curriculum',
    '/quest-map',
  ];

  const extensions = ['.ts', '.tsx'];

  function walkDir(dir: string) {
    if (EXCLUDED_DIRS.some(excl => dir.includes(excl))) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(ROOT, fullPath);

        // Skip this validation script
        if (relativePath.includes('test-rename-validation')) continue;

        for (const oldUrl of oldUrls) {
          if (content.includes(oldUrl)) {
            errors.push(`STALE URL: ${relativePath} contains old URL "${oldUrl}"`);
          }
        }
      }
    }
  }

  walkDir(SRC);
}

// ============================================================
// 5. Check Prisma schema
// ============================================================

function checkPrismaSchema() {
  console.log('\n--- Checking Prisma schema ---');

  const schemaPath = path.join(ROOT, 'prisma/schema.prisma');
  const content = fs.readFileSync(schemaPath, 'utf-8');

  // Should have new column names
  if (content.includes('course_map_position_x')) {
    console.log('  OK: course_map_position_x found in schema');
  } else {
    errors.push('SCHEMA: course_map_position_x not found in prisma/schema.prisma');
  }

  if (content.includes('program_position_x')) {
    console.log('  OK: program_position_x found in schema');
  } else {
    errors.push('SCHEMA: program_position_x not found in prisma/schema.prisma');
  }

  // Should NOT have old column names
  if (content.includes('quest_map_position_x')) {
    errors.push('SCHEMA: Old column quest_map_position_x still in prisma/schema.prisma');
  }

  if (content.includes('curriculum_position_x')) {
    errors.push('SCHEMA: Old column curriculum_position_x still in prisma/schema.prisma');
  }
}

// ============================================================
// Run all checks
// ============================================================

console.log('=== Rename Validation ===');
console.log('Quest Map → Course Map');
console.log('Curriculum Map → Program Map');

scanForStaleReferences();
verifyDirectories();
verifyNewReferences();
checkLinkConsistency();
checkPrismaSchema();

// ============================================================
// Report
// ============================================================

console.log('\n=== Results ===');

if (errors.length === 0 && warnings.length === 0) {
  console.log('\nAll checks passed! Rename is complete and consistent.');
  process.exit(0);
} else {
  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach(w => console.log(`  WARNING: ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach(e => console.log(`  ERROR: ${e}`));
    process.exit(1);
  }

  process.exit(0);
}
