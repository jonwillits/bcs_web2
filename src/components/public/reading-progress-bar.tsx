'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ReadingProgressBarProps {
  className?: string
}

export function ReadingProgressBar({ className }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let ticking = false

    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight

      // Calculate progress percentage
      const scrollProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

      // Clamp between 0 and 100
      setProgress(Math.min(100, Math.max(0, scrollProgress)))

      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress()
        })
        ticking = true
      }
    }

    // Initial calculation
    updateProgress()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none',
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-gradient-to-r from-neural-primary via-synapse-primary to-cognition-teal transition-all duration-150 ease-out shadow-lg shadow-neural-primary/20"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
