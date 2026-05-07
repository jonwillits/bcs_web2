import { prisma } from '@/lib/db'
import { withDatabaseRetry } from '@/lib/retry'

interface SearchResults {
  courses: any[]
  modules: any[]
  people: any[]
}

interface SearchTotals {
  courses: number
  modules: number
  people: number
  all: number
}

export interface UniversalSearchResponse {
  results: SearchResults
  totals: SearchTotals
}

/**
 * Perform universal search across courses, modules, and people
 * @param query - Search query string
 * @param category - Optional category filter ('courses', 'modules', 'people', or 'all')
 * @param limit - Maximum results per category (default: 10, max: 50)
 * @returns Search results and totals
 */
export async function performUniversalSearch(
  query: string,
  category: string = 'all',
  limit: number = 10
): Promise<UniversalSearchResponse> {
  if (!query || query.trim() === '') {
    return {
      results: { courses: [], modules: [], people: [] },
      totals: { courses: 0, modules: 0, people: 0, all: 0 },
    }
  }

  const searchTerm = query.trim().toLowerCase()
  const validLimit = Math.min(Math.max(1, limit), 50) // Max 50 results per category

  const results = await withDatabaseRetry(async () => {
    const [courses, modules, people] = await Promise.all([
      // Search Courses (only published)
      (category === 'all' || category === 'courses')
        ? prisma.courses.findMany({
            where: {
              status: 'published',
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { tags: { has: searchTerm } },
              ],
            },
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  avatar_url: true,
                },
              },
              _count: {
                select: {
                  course_modules: true,
                },
              },
            },
            take: validLimit,
            orderBy: { updated_at: 'desc' },
          })
        : [],

      // Search Modules (only published)
      (category === 'all' || category === 'modules')
        ? prisma.modules.findMany({
            where: {
              status: 'published',
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { content: { contains: searchTerm, mode: 'insensitive' } },
                { tags: { has: searchTerm } },
              ],
            },
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  avatar_url: true,
                },
              },
              modules: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
            take: validLimit,
            orderBy: { updated_at: 'desc' },
          })
        : [],

      // Search People (faculty and students with verified emails)
      (category === 'all' || category === 'people')
        ? prisma.users.findMany({
            where: {
              email_verified: true,
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { speciality: { contains: searchTerm, mode: 'insensitive' } },
                { university: { contains: searchTerm, mode: 'insensitive' } },
                { about: { contains: searchTerm, mode: 'insensitive' } },
                { interested_fields: { has: searchTerm } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              speciality: true,
              university: true,
              avatar_url: true,
              interested_fields: true,
              _count: {
                select: {
                  courses: {
                    where: { status: 'published' },
                  },
                  modules: {
                    where: { status: 'published' },
                  },
                },
              },
            },
            take: validLimit,
            orderBy: { name: 'asc' },
          })
        : [],
    ])

    return { courses, modules, people }
  }, { maxAttempts: 3, baseDelayMs: 500 })

  // Calculate totals
  const totals = {
    courses: results.courses.length,
    modules: results.modules.length,
    people: results.people.length,
    all: results.courses.length + results.modules.length + results.people.length,
  }

  return { results, totals }
}
