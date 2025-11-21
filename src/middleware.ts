import { auth } from "@/lib/auth/config"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { auth: session, nextUrl } = req
  const isLoggedIn = !!session?.user
  const userRole = session?.user?.role

  // Route checks
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isFacultyRoute = nextUrl.pathname.startsWith('/faculty')
  const isStudentRoute = nextUrl.pathname.startsWith('/student')
  const isAuthPage = nextUrl.pathname.startsWith('/auth')

  // Protect admin routes - strictest protection
  if (isAdminRoute) {
    // Not logged in - redirect to login with callback
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
      const loginUrl = new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url)
      return NextResponse.redirect(loginUrl)
    }

    // Logged in but not admin - redirect to home with error
    if (userRole !== 'admin') {
      const homeUrl = new URL('/?error=admin_required', req.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  // Protect faculty routes - faculty OR admin (admin is superuser)
  if (isFacultyRoute) {
    // Not logged in - redirect to login with callback
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
      const loginUrl = new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url)
      return NextResponse.redirect(loginUrl)
    }

    // Logged in but not faculty or admin - redirect to home with error
    if (userRole !== 'faculty' && userRole !== 'admin') {
      const homeUrl = new URL('/?error=faculty_required', req.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  // Protect student routes - ONLY students (strict)
  if (isStudentRoute) {
    // Not logged in - redirect to login with callback
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
      const loginUrl = new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url)
      return NextResponse.redirect(loginUrl)
    }

    // Logged in but pending faculty - redirect to pending approval page
    if (userRole === 'pending_faculty') {
      const pendingUrl = new URL('/auth/pending-approval', req.url)
      return NextResponse.redirect(pendingUrl)
    }

    // Only allow students
    if (userRole !== 'student') {
      const homeUrl = new URL('/?error=student_access_only', req.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  // Redirect to home if already logged in and trying to access auth pages
  if (isAuthPage && isLoggedIn) {
    // Check if there's a callback URL to redirect to
    const callbackUrl = nextUrl.searchParams.get('callbackUrl')
    if (callbackUrl) {
      return NextResponse.redirect(new URL(callbackUrl, req.url))
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

// Force Vercel edge function refresh
