import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen,
  FileText,
  User,
  GraduationCap,
  Building2,
  Target,
  Calendar
} from 'lucide-react'

interface CourseResult {
  id: string
  title: string
  slug: string
  description: string | null
  created_at: Date
  users: {
    id: string
    name: string
    avatar_url: string | null
  }
  _count: {
    course_modules: number
  }
}

interface ModuleResult {
  id: string
  title: string
  slug: string
  description: string | null
  created_at: Date
  users: {
    id: string
    name: string
    avatar_url: string | null
  }
  modules: {
    id: string
    title: string
    slug: string
  } | null
}

interface PersonResult {
  id: string
  name: string
  email: string
  role: string
  speciality: string | null
  university: string | null
  avatar_url: string | null
  interested_fields: string[]
  _count: {
    courses: number
    modules: number
  }
}

interface SearchResultCardProps {
  type: 'course' | 'module' | 'person'
  data: CourseResult | ModuleResult | PersonResult
}

export function SearchResultCard({ type, data }: SearchResultCardProps) {
  if (type === 'course') {
    const course = data as CourseResult
    return (
      <Link
        href={`/courses/${course.slug}`}
        className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all bg-white"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-1">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {course.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {course.users.name}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {course._count.course_modules} modules
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (type === 'module') {
    const moduleData = data as ModuleResult
    return (
      <Link
        href={`/modules/${moduleData.slug}`}
        className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all bg-white"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors mb-1">
              {moduleData.title}
            </h3>
            {moduleData.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {moduleData.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {moduleData.users.name}
              </span>
              {moduleData.modules && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Part of: {moduleData.modules.title}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (type === 'person') {
    const person = data as PersonResult
    return (
      <Link
        href={`/profile/${person.id}`}
        className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow-md transition-all bg-white"
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {person.avatar_url ? (
              <Image
                src={person.avatar_url}
                alt={person.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                {person.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors mb-1">
              {person.name}
            </h3>

            {/* Role Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                <GraduationCap className="h-3 w-3" />
                {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
              </span>
              {(person.role === 'faculty' || person.role === 'admin') && person._count.courses > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  Instructor
                </span>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
              {person.university && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {person.university}
                </span>
              )}
              {person.speciality && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {person.speciality}
                </span>
              )}
            </div>

            {/* Stats */}
            {(person.role === 'faculty' || person.role === 'admin') && (person._count.courses > 0 || person._count.modules > 0) && (
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {person._count.courses > 0 && (
                  <span>{person._count.courses} course{person._count.courses !== 1 ? 's' : ''}</span>
                )}
                {person._count.modules > 0 && (
                  <span>{person._count.modules} module{person._count.modules !== 1 ? 's' : ''}</span>
                )}
              </div>
            )}

            {/* Interested Fields */}
            {person.interested_fields.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {person.interested_fields.slice(0, 3).map((field) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {field}
                  </span>
                ))}
                {person.interested_fields.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    +{person.interested_fields.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return null
}
