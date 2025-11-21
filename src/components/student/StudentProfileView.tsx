'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  GraduationCap,
  Calendar,
  Building2,
  Mail,
  Edit,
  Globe,
  Linkedin,
  Twitter,
  Github,
  BookOpen
} from 'lucide-react'

interface StudentProfileViewProps {
  user: {
    id: string
    name: string
    email: string
    about: string | null
    major: string | null
    graduation_year: number | null
    academic_interests: string[]
    university: string | null
    avatar_url: string | null
    role: string
    created_at: Date
    personal_website_url: string | null
    linkedin_url: string | null
    twitter_url: string | null
    github_url: string | null
  }
  isOwnProfile: boolean
}

export function StudentProfileView({ user, isOwnProfile }: StudentProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses'>('overview')

  const stats = [
    {
      icon: BookOpen,
      label: 'Courses Enrolled',
      value: 0, // Will be populated in Week 3
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: GraduationCap,
      label: 'Progress',
      value: '0%', // Will be calculated in Week 4
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: new Date(user.created_at).getFullYear(),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  const hasLinks = user.personal_website_url || user.linkedin_url || user.twitter_url || user.github_url

  // Generate gradient initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 h-64">
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Action Buttons */}
        {isOwnProfile && (
          <div className="absolute top-6 right-6 z-10">
            <Link
              href="/student/profile/edit"
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors shadow-lg font-medium"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Link>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-12 relative z-20">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={128}
                    height={128}
                    className="rounded-2xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-neural-primary to-synapse-primary flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{initials}</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${user.email}`} className="hover:text-neural-primary">
                      {user.email}
                    </a>
                  </div>
                </div>

                {/* Student Badge */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <GraduationCap className="h-4 w-4" />
                    Student
                  </span>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {user.major && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span>Major: {user.major}</span>
                    </div>
                  )}
                  {user.graduation_year && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Class of {user.graduation_year}</span>
                    </div>
                  )}
                  {user.university && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{user.university}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {hasLinks && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {user.personal_website_url && (
                      <a
                        href={user.personal_website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                    {user.linkedin_url && (
                      <a
                        href={user.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {user.twitter_url && (
                      <a
                        href={user.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {user.github_url && (
                      <a
                        href={user.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-2`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-neural-primary border-b-2 border-neural-primary bg-neural-primary/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'text-neural-primary border-b-2 border-neural-primary bg-neural-primary/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Enrolled Courses
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* About */}
              {user.about && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{user.about}</p>
                </div>
              )}

              {/* Academic Interests */}
              {user.academic_interests.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Interests</h2>
                  <div className="flex flex-wrap gap-2">
                    {user.academic_interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1.5 bg-gradient-to-r from-neural-primary/10 to-synapse-primary/10 text-neural-primary rounded-full text-sm font-medium border border-neural-primary/20"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state if no content */}
              {!user.about && user.academic_interests.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No additional information provided.</p>
                  {isOwnProfile && (
                    <Link
                      href="/student/profile/edit"
                      className="text-neural-primary hover:underline mt-2 inline-block"
                    >
                      Add information to your profile
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Course enrollment will be available in Week 3</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
