'use client'

import { useState, useEffect } from 'react'
import { Key, CheckCircle2, AlertCircle, Trash2, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react'

interface TokenStatus {
  configured: boolean
  updatedAt: string | null
}

export function CanvasTokenSettings() {
  const [status, setStatus] = useState<TokenStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/faculty/canvas-token/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch {
      // Silently fail — component will show unconfigured state
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!token.trim()) {
      setError('Please enter your Canvas API token.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/faculty/canvas-token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Canvas API token saved successfully.')
        setToken('')
        setShowInput(false)
        setShowToken(false)
        setStatus({ configured: true, updatedAt: data.updatedAt })
      } else {
        setError(data.error || 'Failed to save token.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/faculty/canvas-token', { method: 'DELETE' })
      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Canvas API token removed.')
        setStatus({ configured: false, updatedAt: null })
        setShowDeleteConfirm(false)
      } else {
        setError(data.error || 'Failed to remove token.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" />
          Canvas LMS Integration
        </h2>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <Key className="h-5 w-5" />
        Canvas LMS Integration
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Connect your Canvas account to sync quiz grades. Your token is encrypted and stored securely.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-start gap-2 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 border border-green-200 flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {success}
        </div>
      )}

      {status?.configured && !showInput ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium">Canvas token configured</span>
            {status.updatedAt && (
              <span className="text-gray-400">
                — last updated {new Date(status.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowInput(true); setError(''); setSuccess('') }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Update Token
            </button>
            <button
              type="button"
              onClick={() => { setShowDeleteConfirm(true); setError(''); setSuccess('') }}
              className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800 mb-2">
                Are you sure? You won&apos;t be able to sync grades until you add a new token.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deleting ? 'Removing...' : 'Yes, Remove'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded-lg border hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {!status?.configured && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
              To sync quiz grades to Canvas, you need a personal access token.
              Go to Canvas &rarr; Account &rarr; Settings &rarr; Approved Integrations &rarr; New Access Token.
            </div>
          )}

          <div>
            <label htmlFor="canvas-token" className="block text-sm font-medium text-gray-700 mb-1">
              Canvas API Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                id="canvas-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your Canvas personal access token"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !token.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Validating & Saving...
                </>
              ) : (
                'Save Token'
              )}
            </button>
            {status?.configured && (
              <button
                type="button"
                onClick={() => { setShowInput(false); setToken(''); setShowToken(false); setError('') }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            See our Canvas Integration Guide for detailed setup instructions.
          </p>
        </div>
      )}
    </div>
  )
}
