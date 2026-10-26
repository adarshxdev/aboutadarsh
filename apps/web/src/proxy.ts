import { NextResponse, type NextRequest } from 'next/server'

/** Must match SESSION_COOKIE in apps/api/src/lib/session.ts. */
const SESSION_COOKIE = 'admin_session'

/**
 * Optimistic gate for /admin: visitors without a session cookie go to the
 * login page before anything renders. The cookie is verified by the API on
 * every call, and admin pages check it again via /api/auth/me.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (pathname === '/admin/login' || request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const login = new URL('/admin/login', request.url)
  login.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/admin/:path*'],
}
