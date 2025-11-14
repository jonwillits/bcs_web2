'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, GraduationCap, Building2, ExternalLink, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { NeuralButton } from '@/components/ui/neural-button'
import { cn } from '@/lib/utils'

interface InstructorProfile {
  id: string
  name: string
  email?: string
  avatar_url?: string | null
  speciality?: string | null
  university?: string | null
  about?: string | null
  google_scholar_url?: string | null
  personal_website_url?: string | null
  linkedin_url?: string | null
  twitter_url?: string | null
  github_url?: string | null
}

interface InstructorsSectionProps {
  author: InstructorProfile
  collaborators?: InstructorProfile[]
  className?: string
}

export function InstructorsSection({ author, collaborators = [], className }: InstructorsSectionProps) {
  const [showAllModal, setShowAllModal] = useState(false)
  const totalInstructors = 1 + collaborators.length

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showAllModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAllModal])

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Render full profile card
  const renderFullCard = (instructor: InstructorProfile, role: string) => {
    const socialLinks = [
      { url: instructor.linkedin_url, label: 'LinkedIn', icon: '👔' },
      { url: instructor.google_scholar_url, label: 'Google Scholar', icon: '🎓' },
      { url: instructor.personal_website_url, label: 'Website', icon: '🌐' },
      { url: instructor.github_url, label: 'GitHub', icon: '💻' },
      { url: instructor.twitter_url, label: 'Twitter', icon: '🐦' },
    ].filter(link => link.url)

    return (
      <div key={instructor.id} className="p-6 bg-gradient-to-r from-neural-primary/5 to-synapse-primary/5 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Link href={`/profile/${instructor.id}`} className="group block">
              {instructor.avatar_url ? (
                <Image
                  src={instructor.avatar_url}
                  alt={instructor.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg group-hover:ring-neural-primary transition-all"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neural-primary to-synapse-primary flex items-center justify-center ring-4 ring-white shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(instructor.name)}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${instructor.id}`} className="group inline-block">
              <h4 className="text-xl font-bold text-foreground group-hover:text-neural-primary transition-colors">
                {instructor.name}
              </h4>
            </Link>
            <p className="text-xs text-muted-foreground font-medium mb-2">{role}</p>

            {/* Credentials */}
            {(instructor.speciality || instructor.university) && (
              <div className="flex flex-wrap gap-3 mb-3">
                {instructor.speciality && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 text-synapse-primary" />
                    <span>{instructor.speciality}</span>
                  </div>
                )}
                {instructor.university && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 text-cognition-teal" />
                    <span>{instructor.university}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bio */}
            {instructor.about && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                {instructor.about}
              </p>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-border hover:border-neural-primary hover:bg-neural-primary/5 transition-colors"
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render compact avatar card
  const renderCompactCard = (instructor: InstructorProfile) => {
    return (
      <Link
        key={instructor.id}
        href={`/profile/${instructor.id}`}
        className="group flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
      >
        {instructor.avatar_url ? (
          <Image
            src={instructor.avatar_url}
            alt={instructor.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-border group-hover:ring-neural-primary transition-all"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neural-primary to-synapse-primary flex items-center justify-center ring-2 ring-border group-hover:ring-neural-primary transition-all">
            <span className="text-sm font-bold text-white">
              {getInitials(instructor.name)}
            </span>
          </div>
        )}
        <div className="text-center">
          <p className="text-xs font-medium text-foreground group-hover:text-neural-primary transition-colors line-clamp-1">
            {instructor.name}
          </p>
          {instructor.speciality && (
            <p className="text-xs text-muted-foreground line-clamp-1">{instructor.speciality}</p>
          )}
        </div>
      </Link>
    )
  }

  // Tiered rendering logic
  const renderInstructors = () => {
    // 1-3 instructors: Show all with full cards
    if (totalInstructors <= 3) {
      return (
        <div className="space-y-4">
          {renderFullCard(author, 'Course Creator')}
          {collaborators.map(collab => renderFullCard(collab, 'Co-Instructor'))}
        </div>
      )
    }

    // 4-6 instructors: Author full + top 2 full + rest compact
    if (totalInstructors <= 6) {
      const topCollaborators = collaborators.slice(0, 2)
      const remainingCollaborators = collaborators.slice(2)

      return (
        <div className="space-y-4">
          {renderFullCard(author, 'Course Creator')}
          {topCollaborators.map(collab => renderFullCard(collab, 'Co-Instructor'))}

          {remainingCollaborators.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Contributing Instructors ({remainingCollaborators.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {remainingCollaborators.map(renderCompactCard)}
              </div>
            </div>
          )}
        </div>
      )
    }

    // 7+ instructors: Author full + first 8 compact + "View All" button
    const visibleCollaborators = collaborators.slice(0, 8)
    const hiddenCount = collaborators.length - 8

    return (
      <div className="space-y-4">
        {renderFullCard(author, 'Course Creator')}

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4" />
            Co-Instructors ({collaborators.length})
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
            {visibleCollaborators.map(renderCompactCard)}
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowAllModal(true)}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neural-primary/20 to-synapse-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-neural-primary">+{hiddenCount}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">More</p>
              </button>
            )}
          </div>
          <NeuralButton
            variant="outline"
            size="sm"
            onClick={() => setShowAllModal(true)}
            className="w-full"
          >
            View All {totalInstructors} Instructors
          </NeuralButton>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
          {totalInstructors === 1 ? (
            <>
              <User className="h-4 w-4" />
              Instructor
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Instructors ({totalInstructors})
            </>
          )}
        </h3>
        {renderInstructors()}
      </div>

      {/* Modal for viewing all instructors (7+ case) */}
      {showAllModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center px-2 sm:px-4 pt-8 sm:pt-12 pb-4" onClick={() => setShowAllModal(false)}>
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex-shrink-0 bg-background border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">All Instructors ({totalInstructors})</h2>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {renderFullCard(author, 'Course Creator')}
              {collaborators.map(collab => renderFullCard(collab, 'Co-Instructor'))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
