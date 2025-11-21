"use client";

import { EnhancedCourseViewer } from './enhanced-course-viewer'

interface CourseViewerProps {
  course: any
  initialModule?: string
  initialSearch?: string
  session?: any
  isStarted?: boolean
}

export function CourseViewer({ course, initialModule, initialSearch, session, isStarted }: CourseViewerProps) {
  return (
    <EnhancedCourseViewer
      course={course}
      initialModule={initialModule}
      initialSearch={initialSearch}
      session={session}
      isStarted={isStarted}
    />
  )
}
