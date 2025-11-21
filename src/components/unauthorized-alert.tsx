'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, X } from 'lucide-react'
import { NeuralButton } from '@/components/ui/neural-button'

interface UnauthorizedAlertProps {
  searchParams: Promise<{ error?: string }>
}

export function UnauthorizedAlert({ searchParams }: UnauthorizedAlertProps) {
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    searchParams.then((params) => {
      if (params.error === 'admin_required') {
        setError('You do not have permission to access that page. Admin access required.')
        setIsVisible(true)
      } else if (params.error === 'faculty_required') {
        setError('You do not have permission to access that page. Faculty access required.')
        setIsVisible(true)
      } else if (params.error === 'unauthorized') {
        setError('You do not have permission to access that page.')
        setIsVisible(true)
      }
    })
  }, [searchParams])

  const handleDismiss = () => {
    setIsVisible(false)
    // Remove error parameter from URL
    router.replace('/')
  }

  if (!isVisible || !error) {
    return null
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-5 duration-300">
      <Alert variant="destructive" className="shadow-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-start justify-between">
          <span className="flex-1">{error}</span>
          <NeuralButton
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-2 h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
          </NeuralButton>
        </AlertDescription>
      </Alert>
    </div>
  )
}
