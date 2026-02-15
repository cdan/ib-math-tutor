import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for the auth cookie
  const authCookie = request.cookies.get('auth_token')
  const isAuthenticated = authCookie?.value === 'valid'

  // Paths that don't require authentication
  const isPublicPath = request.nextUrl.pathname === '/login' || 
                       request.nextUrl.pathname.startsWith('/api/login') ||
                       request.nextUrl.pathname.startsWith('/_next') || 
                       request.nextUrl.pathname.startsWith('/favicon.ico');

  if (!isAuthenticated && !isPublicPath) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && request.nextUrl.pathname === '/login') {
    // Redirect to home if already authenticated
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (except api/login)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
