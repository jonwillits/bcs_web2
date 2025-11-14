'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User, GraduationCap, Building2, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InstructorSectionProps {
  instructor: {
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
  className?: string
}

export function InstructorSection({ instructor, className }: InstructorSectionProps) {
  const socialLinks = [
    { url: instructor.linkedin_url, label: 'LinkedIn', icon: '👔' },
    { url: instructor.google_scholar_url, label: 'Google Scholar', icon: '🎓' },
    { url: instructor.personal_website_url, label: 'Website', icon: '🌐' },
    { url: instructor.github_url, label: 'GitHub', icon: '💻' },
    { url: instructor.twitter_url, label: 'Twitter', icon: '🐦' },
  ].filter(link => link.url)

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-6 bg-gradient-to-r from-neural-primary/5 to-synapse-primary/5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
          Instructor
        </h3>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Link
              href={`/profile/${instructor.id}`}
              className="group block"
            >
              {instructor.avatar_url ? (
                <Image
                  src={instructor.avatar_url}
                  alt={instructor.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg group-hover:ring-neural-primary transition-all"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neural-primary to-synapse-primary flex items-center justify-center ring-4 ring-white shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-3xl font-bold text-white">
                    {getInitials(instructor.name)}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <Link
              href={`/profile/${instructor.id}`}
              className="group inline-block"
            >
              <h4 className="text-2xl font-bold text-foreground group-hover:text-neural-primary transition-colors">
                {instructor.name}
              </h4>
            </Link>

            {/* Credentials */}
            <div className="flex flex-wrap gap-4 mt-2 mb-3">
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

            {/* Bio */}
            {instructor.about && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-border hover:border-neural-primary hover:bg-neural-primary/5 transition-colors"
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
    </Card>
  )
}
