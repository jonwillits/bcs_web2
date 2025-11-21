"use client";

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NeuralButton } from '@/components/ui/neural-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  User,
  Building,
  GraduationCap,
  Globe,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface FacultyRequest {
  id: string
  request_statement: string
  requested_at: string
  approval_status: string
  requester: {
    id: string
    name: string
    email: string
    university: string
    department: string
    title: string
    research_area: string
    personal_website_url: string | null
    email_verified: boolean
  }
}

export default function FacultyRequestsPage() {
  const [requests, setRequests] = useState<FacultyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null)
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/faculty-requests?status=pending')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests')
      }

      setRequests(data.requests)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      setProcessing(requestId)
      setError('')
      setSuccessMessage('')

      const response = await fetch(`/api/admin/faculty-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          admin_note: adminNote || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve request')
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
      setAdminNote('')
      setShowApproveModal(null)
      setSuccessMessage('Faculty request approved successfully!')

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request')
    } finally {
      setProcessing(null)
    }
  }

  const handleDecline = async (requestId: string) => {
    if (!declineReason.trim()) {
      setError('Please provide a reason for declining')
      return
    }

    try {
      setProcessing(requestId)
      setError('')

      const response = await fetch(`/api/admin/faculty-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline',
          decline_reason: declineReason,
          admin_note: adminNote || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline request')
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
      setDeclineReason('')
      setAdminNote('')
      setShowDeclineModal(null)
      setSuccessMessage('Faculty request declined')

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neural-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading faculty requests...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-neural-primary mb-2">
            Faculty Requests
          </h2>
          <p className="text-muted-foreground">
            Review and approve or decline faculty registration requests
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {requests.length === 0 ? (
          <Card className="cognitive-card">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                No pending faculty requests at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.id} className="cognitive-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {request.requester.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {request.requester.email}
                        {!request.requester.email_verified && (
                          <span className="ml-2 text-xs text-yellow-600">
                            (Email not verified)
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(request.requested_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Faculty Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">University</p>
                        <p className="text-sm text-muted-foreground">
                          {request.requester.university}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Department</p>
                        <p className="text-sm text-muted-foreground">
                          {request.requester.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Title/Position</p>
                        <p className="text-sm text-muted-foreground">
                          {request.requester.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Research Area</p>
                        <p className="text-sm text-muted-foreground">
                          {request.requester.research_area}
                        </p>
                      </div>
                    </div>
                  </div>

                  {request.requester.personal_website_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={request.requester.personal_website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neural-primary hover:underline flex items-center gap-1"
                      >
                        {request.requester.personal_website_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Request Statement */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Request Statement</Label>
                    <div className="p-4 bg-muted/50 rounded-lg border border-neural-light/30">
                      <p className="text-sm whitespace-pre-wrap">
                        {request.request_statement}
                      </p>
                    </div>
                  </div>

                  {/* Admin Note (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor={`note-${request.id}`}>
                      Admin Note <span className="text-muted-foreground text-xs">(Optional)</span>
                    </Label>
                    <Textarea
                      id={`note-${request.id}`}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add any notes about this request (visible in audit logs)"
                      className="border-neural-light/30 focus:border-neural-primary"
                      rows={2}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-neural-light/30">
                    <NeuralButton
                      variant="neural"
                      onClick={() => setShowApproveModal(request.id)}
                      disabled={processing === request.id}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processing === request.id ? 'Approving...' : 'Approve Request'}
                    </NeuralButton>
                    <NeuralButton
                      variant="destructive"
                      onClick={() => setShowDeclineModal(request.id)}
                      disabled={processing === request.id}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline Request
                    </NeuralButton>
                  </div>

                  {/* Approve Modal */}
                  {showApproveModal === request.id && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <Card className="max-w-md w-full">
                        <CardHeader>
                          <CardTitle>Approve Faculty Request</CardTitle>
                          <CardDescription>
                            Confirm approval for {request.requester.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                              This will grant faculty access to <strong>{request.requester.name}</strong> ({request.requester.email}), allowing them to create and manage courses and modules.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <NeuralButton
                              variant="neural"
                              onClick={() => handleApprove(request.id)}
                              disabled={processing === request.id}
                              className="flex-1"
                            >
                              {processing === request.id ? 'Approving...' : 'Confirm Approval'}
                            </NeuralButton>
                            <NeuralButton
                              variant="outline"
                              onClick={() => setShowApproveModal(null)}
                              disabled={processing === request.id}
                              className="flex-1"
                            >
                              Cancel
                            </NeuralButton>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Decline Modal */}
                  {showDeclineModal === request.id && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <Card className="max-w-md w-full">
                        <CardHeader>
                          <CardTitle>Decline Faculty Request</CardTitle>
                          <CardDescription>
                            Please provide a reason for declining this request
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="decline-reason">
                              Decline Reason <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="decline-reason"
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
                              placeholder="Explain why this request is being declined..."
                              className="border-neural-light/30 focus:border-neural-primary"
                              rows={4}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              This reason will be sent to the applicant
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <NeuralButton
                              variant="destructive"
                              onClick={() => handleDecline(request.id)}
                              disabled={!declineReason.trim() || processing === request.id}
                              className="flex-1"
                            >
                              {processing === request.id ? 'Declining...' : 'Confirm Decline'}
                            </NeuralButton>
                            <NeuralButton
                              variant="outline"
                              onClick={() => {
                                setShowDeclineModal(null)
                                setDeclineReason('')
                              }}
                              disabled={processing === request.id}
                              className="flex-1"
                            >
                              Cancel
                            </NeuralButton>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
