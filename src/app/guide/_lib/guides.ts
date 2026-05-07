export type GuideRole = 'public' | 'faculty'

export interface GuideEntry {
  slug: string
  file: string
  title: string
  description: string
  role: GuideRole
}

export const GUIDES: GuideEntry[] = [
  {
    slug: 'user-guide',
    file: 'USER_GUIDE.md',
    title: 'User Guide',
    description:
      'Complete guide to using the BCS E-Learning Platform — browsing courses, managing content, tracking progress, and more.',
    role: 'public',
  },
  {
    slug: 'tensorflow-technical',
    file: 'TF_PLAYGROUND_TECHNICAL_GUIDE.md',
    title: 'TensorFlow Playground Technical Guide',
    description:
      'Technical documentation for the interactive neural network playground — datasets, architectures, and training visualization.',
    role: 'public',
  },
  {
    slug: 'quiz-system',
    file: 'QUIZ_SYSTEM_GUIDE.md',
    title: 'Quiz System Guide',
    description:
      'Question banks, quiz configuration, grading rules, and the assessment architecture.',
    role: 'faculty',
  },
  {
    slug: 'canvas-integration',
    file: 'CANVAS_LMS_INTEGRATION_GUIDE.md',
    title: 'Canvas LMS Grade Sync Guide',
    description:
      'Sync quiz grades to Canvas via API or CSV import — setup, student matching, and troubleshooting.',
    role: 'faculty',
  },
  {
    slug: 'architecture',
    file: 'ARCHITECTURE_GUIDE.md',
    title: 'Platform Architecture',
    description:
      'System overview, request lifecycle, data model diagrams, scalability architecture, and security layers.',
    role: 'faculty',
  },
  {
    slug: 'system-design',
    file: 'SYSTEM_DESIGN_ANALYSIS.md',
    title: 'System Design Analysis',
    description:
      'In-depth analysis of design decisions, scalability ratings, and improvement roadmap.',
    role: 'faculty',
  },
  {
    slug: 'sentry-setup',
    file: 'SENTRY_SETUP_GUIDE.md',
    title: 'Sentry Error Tracking Setup',
    description:
      'Configure Sentry for error monitoring — project setup, environment variables, verification, and daily usage.',
    role: 'faculty',
  },
  {
    slug: 'faculty-guide',
    file: 'FACULTY_GUIDE.md',
    title: 'Faculty Guide',
    description:
      'Creating courses and modules, building quizzes, viewing analytics, managing groups, and exporting grades.',
    role: 'faculty',
  },
  {
    slug: 'admin-guide',
    file: 'ADMIN_GUIDE.md',
    title: 'Admin Guide',
    description:
      'User management, faculty approvals, content moderation, platform analytics, and audit logs.',
    role: 'faculty',
  },
  {
    slug: 'email-setup',
    file: 'EMAIL_SETUP_GUIDE.md',
    title: 'Email Setup Guide',
    description:
      'Configure Resend for email verification and password reset — API keys, domain verification, and environment variables.',
    role: 'faculty',
  },
  {
    slug: 'database-migrations',
    file: 'DATABASE_MIGRATION_GUIDE.md',
    title: 'Database Migration Guide',
    description:
      'Prisma migration workflow — creating migrations, deploying to production, and avoiding common pitfalls.',
    role: 'faculty',
  },
  {
    slug: 'dev-prod-workflow',
    file: 'DEV_PROD_WORKFLOW.md',
    title: 'Dev & Production Workflow',
    description:
      'Development and production environments, Vercel deployment pipeline, and environment variable management.',
    role: 'faculty',
  },
]

export function getGuideBySlug(slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
