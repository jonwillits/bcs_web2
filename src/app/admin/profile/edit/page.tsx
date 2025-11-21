'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'

export default function AdminEditProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    about: '',
    speciality: '',
    university: '',
    interested_fields: [] as string[],
    avatar_url: '',
    google_scholar_url: '',
    personal_website_url: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: ''
  })

  const [newField, setNewField] = useState('')

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
              about: data.user.about || '',
              speciality: data.user.speciality || '',
              university: data.user.university || '',
              interested_fields: data.user.interested_fields || [],
              avatar_url: data.user.avatar_url || '',
              google_scholar_url: data.user.google_scholar_url || '',
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

  const addInterestedField = () => {
    if (newField.trim() && !formData.interested_fields.includes(newField.trim())) {
      setFormData(prev => ({
        ...prev,
        interested_fields: [...prev.interested_fields, newField.trim()]
      }))
      setNewField('')
    }
  }

  const removeInterestedField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      interested_fields: prev.interested_fields.filter(f => f !== field)
    }))
  }

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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Admin Profile</h1>

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

            {/* Speciality */}
            <div>
              <label htmlFor="speciality" className="block text-sm font-medium text-gray-700 mb-1">
                Speciality
              </label>
              <input
                type="text"
                id="speciality"
                value={formData.speciality}
                onChange={(e) => setFormData(prev => ({ ...prev, speciality: e.target.value }))}
                placeholder="e.g., Computer Science, Physics, Mathematics"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                placeholder="Tell us about yourself, your research, teaching philosophy, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Interested Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interested Fields
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterestedField())}
                  placeholder="Add a field of interest"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addInterestedField}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.interested_fields.map((field) => (
                  <span
                    key={field}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {field}
                    <button
                      type="button"
                      onClick={() => removeInterestedField(field)}
                      className="text-blue-500 hover:text-blue-700 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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

            {/* Academic & Social Links Section */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic & Social Links</h2>

              {/* Google Scholar */}
              <div className="mb-4">
                <label htmlFor="google_scholar_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Scholar Profile
                </label>
                <input
                  type="url"
                  id="google_scholar_url"
                  value={formData.google_scholar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_scholar_url: e.target.value }))}
                  placeholder="https://scholar.google.com/citations?user=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

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
