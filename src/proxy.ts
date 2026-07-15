import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/soul-profile', '/letters', '/future-self', '/settings']
const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token')
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublic = publicRoutes.some(route =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )
  const isApiAuth = pathname.startsWith('/api/auth') || pathname.startsWith('/api/register') || pathname.startsWith('/api/trpc')

  if (isApiAuth || !isProtected || isPublic) {
    return NextResponse.next()
  }

  if (!hasSessionCookie(request)) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
