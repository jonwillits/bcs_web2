/**
 * List of faculty titles/positions for faculty registration
 * Used in faculty registration form dropdown
 */

export const FACULTY_TITLES = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Adjunct Professor',
  'Visiting Professor',
  'Professor Emeritus',
  'Lecturer',
  'Senior Lecturer',
  'Instructor',
  'Teaching Assistant Professor',
  'Research Professor',
  'Clinical Professor',
  'Researcher',
  'Senior Researcher',
  'Research Scientist',
  'Research Associate',
  'Postdoctoral Researcher',
  'Postdoctoral Fellow',
  'Graduate Teaching Assistant',
  'Graduate Research Assistant',
  'Lab Manager',
  'Course Coordinator',
  'Program Director',
  'Department Chair',
  'Other',
] as const

export type FacultyTitle = (typeof FACULTY_TITLES)[number]

/**
 * Check if a faculty title is valid
 */
export function isValidFacultyTitle(title: string): boolean {
  return FACULTY_TITLES.includes(title as FacultyTitle)
}

/**
 * Get faculty title display name (same as value for now)
 */
export function getFacultyTitleDisplay(title: FacultyTitle): string {
  return title
}
