'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'
import { MAJORS } from '@/lib/constants/majors'
import { ACADEMIC_INTERESTS } from '@/lib/constants/academic-interests'

export default function StudentEditProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    major: '',
    graduation_year: '',
    academic_interests: [] as string[],
    about: '',
    university: '',
    avatar_url: '',
    personal_website_url: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: ''
  })

  const [newInterest, setNewInterest] = useState('')

  // Fetch current profile data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/profile`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFormData({
              name: data.user.name || '',
              major: data.user.major || '',
              graduation_year: data.user.graduation_year ? data.user.graduation_year.toString() : '',
              academic_interests: data.user.academic_interests || [],
              about: data.user.about || '',
              university: data.user.university || '',
              avatar_url: data.user.avatar_url || '',
              personal_website_url: data.user.personal_website_url || '',
              linkedin_url: data.user.linkedin_url || '',
              twitter_url: data.user.twitter_url || '',
              github_url: data.user.github_url || ''
            })
          }
          setLoading(false)
        })
        .catch(() => {
          setMessage({ type: 'error', text: 'Failed to load profile data' })
          setLoading(false)
        })
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setTimeout(() => {
          router.push(`/profile/${session?.user?.id}`)
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' })
    } finally {
      setSaving(false)
    }
  }

  const addInterest = () => {
    if (newInterest.trim() && !formData.academic_interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        academic_interests: [...prev.academic_interests, newInterest.trim()]
      }))
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      academic_interests: prev.academic_interests.filter(i => i !== interest)
    }))
  }

  const currentYear = new Date().getFullYear()
  const graduationYears = Array.from({ length: 7 }, (_, i) => currentYear + i)

  if (loading || status === 'loading') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Student Profile</h1>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Major */}
              <div>
                <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
                  Major
                </label>
                <select
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your major</option>
                  {MAJORS.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>

              {/* Graduation Year */}
              <div>
                <label htmlFor="graduation_year" className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <select
                  id="graduation_year"
                  value={formData.graduation_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, graduation_year: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select graduation year</option>
                  {graduationYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* University */}
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
                  University
                </label>
                <input
                  type="text"
                  id="university"
                  value={formData.university}
                  onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  placeholder="e.g., University of Illinois"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Academic Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Interests
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    placeholder="Add an academic interest"
                    list="interest-suggestions"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <datalist id="interest-suggestions">
                    {ACADEMIC_INTERESTS.map((interest) => (
                      <option key={interest} value={interest} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={addInterest}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.academic_interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="text-blue-500 hover:text-blue-700 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* About */}
              <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
                  About
                </label>
                <textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  rows={6}
                  placeholder="Tell us about yourself, your academic interests, career goals, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL (optional)
                </label>
                <input
                  type="url"
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Social Links Section */}
              <div className="pt-4 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h2>

                {/* Personal Website */}
                <div className="mb-4">
                  <label htmlFor="personal_website_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Website
                  </label>
                  <input
                    type="url"
                    id="personal_website_url"
                    value={formData.personal_website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, personal_website_url: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* LinkedIn */}
                <div className="mb-4">
                  <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Twitter */}
                <div className="mb-4">
                  <label htmlFor="twitter_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter/X Profile
                  </label>
                  <input
                    type="url"
                    id="twitter_url"
                    value={formData.twitter_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                    placeholder="https://twitter.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* GitHub */}
                <div>
                  <label htmlFor="github_url" className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub Profile
                  </label>
                  <input
                    type="url"
                    id="github_url"
                    value={formData.github_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
