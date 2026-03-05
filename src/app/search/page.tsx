import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PublicLayout } from '@/components/layouts/app-layout'
import { UniversalSearchResults } from '@/components/search/UniversalSearchResults'
import { performUniversalSearch } from '@/lib/search'

export const metadata: Metadata = {
  title: 'Search - BCS E-Learning Platform',
  description: 'Search courses, modules, instructors, and students across the Brain & Cognitive Sciences platform',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q : ''

  // Redirect to home if no query
  if (!query || query.trim() === '') {
    redirect('/')
  }

  // Perform search directly (no HTTP call needed - we're on the server)
  const { results, totals } = await performUniversalSearch(query)

  return (
    <PublicLayout>
      <UniversalSearchResults
        initialQuery={query}
        initialResults={results}
        initialTotals={totals}
      />
    </PublicLayout>
  )
}
