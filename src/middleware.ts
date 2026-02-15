import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // console.log("Middleware running on:", request.nextUrl.pathname); // Debug log

  // Check for the auth cookie
  const authCookie = request.cookies.get('auth_token')
  const isAuthenticated = authCookie?.value === 'valid'

  // Paths that don't require authentication
  const isPublicPath = request.nextUrl.pathname === '/login' || 
                       request.nextUrl.pathname.startsWith('/api/login') || // allow login api
                       request.nextUrl.pathname.startsWith('/_next') ||      // allow assets
                       request.nextUrl.pathname.startsWith('/favicon.ico');   // allow favicon

  if (!isAuthenticated && !isPublicPath) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If already logged in and visiting login page, go to home
  if (isAuthenticated && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
