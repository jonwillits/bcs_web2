import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Mail, Home } from 'lucide-react'
import Link from 'next/link'
import { NeuralButton } from '@/components/ui/neural-button'
import { PublicLayout } from '@/components/layouts/app-layout'

export default async function PendingApprovalPage() {
  const session = await auth()

  // Redirect if not logged in
  if (!session?.user) {
    redirect('/auth/login')
  }

  // Redirect if not pending_faculty
  if (session.user.role !== 'pending_faculty') {
    redirect('/')
  }

  return (
    <PublicLayout showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <Card className="cognitive-card">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Faculty Request Pending</CardTitle>
              <CardDescription className="text-base mt-2">
                Your faculty access request is currently being reviewed by our administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">1.</span>
                    <span>
                      Our team will review your request and verify your credentials
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">2.</span>
                    <span>
                      You will receive an email notification once your request has been processed
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">3.</span>
                    <span>
                      If approved, you&apos;ll gain full access to create and manage courses
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Check your email</p>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll send updates to <strong>{session.user.email}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Review timeline</p>
                    <p className="text-sm text-muted-foreground">
                      Most requests are reviewed within 1-2 business days
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neural-light/30">
                <p className="text-sm text-muted-foreground mb-4">
                  While you wait, you can explore the platform:
                </p>
                <Link href="/">
                  <NeuralButton variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Browse Courses and Modules
                  </NeuralButton>
                </Link>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Questions about your request?{' '}
                  <a
                    href="mailto:support@brainandcognitivescience.org"
                    className="text-neural-primary hover:underline"
                  >
                    Contact support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  )
}
