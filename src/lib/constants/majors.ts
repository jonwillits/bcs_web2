/**
 * List of academic majors for student registration
 * Used in student registration form dropdown
 */

export const MAJORS = [
  // Cognitive Sciences
  'Brain and Cognitive Science',
  'Cognitive Science',
  'Neuroscience',
  'Psychology',
  'Behavioral Neuroscience',

  // Computer Science & Engineering
  'Computer Science',
  'Software Engineering',
  'Computer Engineering',
  'Electrical Engineering',
  'Biomedical Engineering',
  'Mechanical Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Industrial Engineering',
  'Aerospace Engineering',

  // Natural Sciences
  'Biology',
  'Molecular Biology',
  'Biochemistry',
  'Chemistry',
  'Physics',
  'Biophysics',
  'Astrophysics',
  'Environmental Science',
  'Mathematics',
  'Applied Mathematics',
  'Statistics',
  'Data Science',

  // Life Sciences
  'Bioengineering',
  'Biotechnology',
  'Genetics',
  'Microbiology',
  'Zoology',
  'Botany',
  'Ecology',
  'Pre-Medicine',
  'Pre-Dental',
  'Pre-Veterinary',
  'Nursing',
  'Public Health',
  'Kinesiology',

  // Social Sciences
  'Anthropology',
  'Sociology',
  'Political Science',
  'Economics',
  'International Relations',
  'Geography',

  // Humanities
  'Philosophy',
  'Linguistics',
  'English',
  'History',
  'Art History',

  // Interdisciplinary
  'Human-Computer Interaction',
  'Computational Biology',
  'Artificial Intelligence',
  'Machine Learning',
  'Robotics',
  'Information Science',
  'Educational Technology',
  'Science Education',

  // Business & Applied Fields
  'Business Administration',
  'Information Systems',
  'Operations Research',

  // Other
  'Undecided',
  'Other',
] as const

export type Major = (typeof MAJORS)[number]

/**
 * Get suggested majors based on search query
 */
export function filterMajors(query: string): string[] {
  if (!query) return MAJORS.slice(0, 10) // Show first 10 by default

  const lowerQuery = query.toLowerCase()
  return MAJORS.filter(major =>
    major.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Check if a major is valid
 */
export function isValidMajor(major: string): boolean {
  return MAJORS.includes(major as Major)
}
