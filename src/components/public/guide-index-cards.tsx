'use client'

import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Shield, ArrowRight } from 'lucide-react'
import type { GuideEntry } from '@/app/guide/_lib/guides'

interface GuideIndexCardsProps {
  guides: GuideEntry[]
}

export function GuideIndexCards({ guides }: GuideIndexCardsProps) {
  const publicGuides = guides.filter((g) => g.role === 'public')
  const facultyGuides = guides.filter((g) => g.role === 'faculty')

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Documentation
        </h1>
        <p className="text-muted-foreground">
          Guides and reference material for the BCS E-Learning Platform.
        </p>
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Platform Guides</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicGuides.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </section>

      {facultyGuides.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Faculty & Admin</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facultyGuides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function GuideCard({ guide }: { guide: GuideEntry }) {
  return (
    <Link href={`/guide/${guide.slug}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-center justify-between mb-1">
            <Badge
              variant={guide.role === 'faculty' ? 'neural' : 'cognitive'}
              className="text-[10px] px-2 py-0"
            >
              {guide.role === 'faculty' ? 'Faculty' : 'Public'}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardTitle className="text-base">{guide.title}</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            {guide.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
