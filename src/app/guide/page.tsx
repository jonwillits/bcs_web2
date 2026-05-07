import { Metadata } from 'next'
import { auth } from '@/lib/auth/config'
import { hasFacultyAccess } from '@/lib/auth/utils'
import { PublicLayout } from '@/components/layouts/app-layout'
import { GuideIndexCards } from '@/components/public/guide-index-cards'
import { GUIDES } from './_lib/guides'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Documentation | BCS E-Learning',
  description:
    'Browse all documentation guides for the BCS E-Learning Platform.',
}

export default async function GuideIndexPage() {
  const session = await auth()
  const isFaculty = hasFacultyAccess(session)

  // Only show faculty guides to faculty/admin users
  const visibleGuides = isFaculty
    ? GUIDES
    : GUIDES.filter((g) => g.role === 'public')

  return (
    <PublicLayout>
      <GuideIndexCards guides={visibleGuides} />
    </PublicLayout>
  )
}
