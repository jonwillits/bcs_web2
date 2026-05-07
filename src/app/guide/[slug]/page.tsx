import { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { hasFacultyAccess } from '@/lib/auth/utils'
import { PublicLayout } from '@/components/layouts/app-layout'
import { UserGuide } from '@/components/public/user-guide'
import { GUIDES, getGuideBySlug } from '../_lib/guides'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) {
    return { title: 'Not Found | BCS E-Learning' }
  }

  return {
    title: `${guide.title} | BCS E-Learning`,
    description: guide.description,
  }
}

export default async function GuideDocPage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) {
    notFound()
  }

  // Faculty-only guides return 404 for non-faculty users
  if (guide.role === 'faculty') {
    const session = await auth()
    if (!hasFacultyAccess(session)) {
      notFound()
    }
  }

  const filePath = path.join(process.cwd(), 'docs', guide.file)
  const content = fs.readFileSync(filePath, 'utf-8')

  return (
    <PublicLayout>
      <UserGuide content={content} />
    </PublicLayout>
  )
}
