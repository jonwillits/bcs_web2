import { auth } from "@/lib/auth/config"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { auth: session, nextUrl } = req
  const isLoggedIn = !!session?.user
  const isFacultyRoute = nextUrl.pathname.startsWith('/faculty')
  const isAuthPage = nextUrl.pathname.startsWith('/auth')

  // Protect faculty routes
  if (isFacultyRoute) {
    // Not logged in - redirect to login with callback
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
      const loginUrl = new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url)
      return NextResponse.redirect(loginUrl)
    }

    // Logged in but not faculty - redirect to home with error
    if (session.user.role !== 'faculty') {
      const homeUrl = new URL('/?error=unauthorized', req.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  // Redirect to home if already logged in and trying to access auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
