/**
 * List of academic interests/research areas
 * Used for both student academic interests and faculty research areas
 */

export const ACADEMIC_INTERESTS = [
  // Neuroscience & Brain Sciences
  'Neuroscience',
  'Cognitive Neuroscience',
  'Computational Neuroscience',
  'Behavioral Neuroscience',
  'Systems Neuroscience',
  'Neurophysiology',
  'Neuroimaging',
  'Brain-Computer Interfaces',
  'Neural Networks',
  'Neuroplasticity',

  // Cognitive Science
  'Cognitive Science',
  'Cognitive Psychology',
  'Perception',
  'Attention',
  'Memory',
  'Learning',
  'Language',
  'Decision Making',
  'Problem Solving',
  'Reasoning',

  // Artificial Intelligence & Machine Learning
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Reinforcement Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Robotics',
  'Neural Computation',
  'Cognitive Architectures',

  // Psychology
  'Psychology',
  'Developmental Psychology',
  'Social Psychology',
  'Clinical Psychology',
  'Educational Psychology',
  'Organizational Psychology',

  // Biology & Life Sciences
  'Molecular Biology',
  'Genetics',
  'Biochemistry',
  'Cell Biology',
  'Computational Biology',
  'Bioinformatics',
  'Systems Biology',
  'Evolutionary Biology',

  // Data Science & Analytics
  'Data Science',
  'Data Analytics',
  'Statistical Modeling',
  'Big Data',
  'Data Visualization',

  // Human-Computer Interaction
  'Human-Computer Interaction',
  'User Experience',
  'Interface Design',
  'Usability',
  'Accessibility',

  // Education & Learning
  'Education',
  'Learning Sciences',
  'Educational Technology',
  'Instructional Design',
  'STEM Education',
  'Online Learning',

  // Philosophy & Logic
  'Philosophy',
  'Philosophy of Mind',
  'Philosophy of Science',
  'Logic',
  'Ethics',
  'Epistemology',

  // Linguistics
  'Linguistics',
  'Psycholinguistics',
  'Computational Linguistics',
  'Syntax',
  'Semantics',
  'Phonetics',

  // Applied Sciences
  'Biomedical Engineering',
  'Medical Imaging',
  'Drug Discovery',
  'Clinical Research',
  'Translational Research',

  // Interdisciplinary
  'Cognitive Development',
  'Embodied Cognition',
  'Consciousness',
  'Emotion',
  'Motivation',
  'Sleep & Circadian Rhythms',
  'Pain',
  'Sensory Systems',
  'Motor Control',

  // Other
  'Other',
] as const

export type AcademicInterest = (typeof ACADEMIC_INTERESTS)[number]

/**
 * Get suggested interests based on search query
 */
export function filterInterests(query: string): string[] {
  if (!query) return ACADEMIC_INTERESTS.slice(0, 15) // Show first 15 by default

  const lowerQuery = query.toLowerCase()
  return ACADEMIC_INTERESTS.filter(interest =>
    interest.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Check if an interest is valid
 */
export function isValidInterest(interest: string): boolean {
  return ACADEMIC_INTERESTS.includes(interest as AcademicInterest)
}

/**
 * Get interests grouped by category (for UI organization)
 */
export function getInterestsByCategory() {
  return {
    'Neuroscience & Brain': ACADEMIC_INTERESTS.slice(0, 10),
    'Cognitive Science': ACADEMIC_INTERESTS.slice(10, 20),
    'AI & Machine Learning': ACADEMIC_INTERESTS.slice(20, 29),
    'Psychology': ACADEMIC_INTERESTS.slice(29, 35),
    'Biology': ACADEMIC_INTERESTS.slice(35, 43),
    'Data Science': ACADEMIC_INTERESTS.slice(43, 48),
    'Human-Computer Interaction': ACADEMIC_INTERESTS.slice(48, 53),
    'Education': ACADEMIC_INTERESTS.slice(53, 59),
    'Philosophy & Logic': ACADEMIC_INTERESTS.slice(59, 65),
    'Linguistics': ACADEMIC_INTERESTS.slice(65, 71),
    'Applied Sciences': ACADEMIC_INTERESTS.slice(71, 76),
    'Other': ACADEMIC_INTERESTS.slice(76),
  }
}
