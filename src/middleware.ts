import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Get subdomain
  let subdomain: string | null = null
  
  if (hostname.includes('localhost')) {
    // For local development
    const parts = hostname.split('.')
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0]
    }
  } else {
    // Production
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      subdomain = parts[0]
    }
  }
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Super Admin Panel Routing
  if (subdomain === 'admin' || pathname.startsWith('/super-admin')) {
    requestHeaders.set('x-super-admin', 'true')
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Tenant Routing
  if (subdomain && subdomain !== 'www') {
    requestHeaders.set('x-tenant-subdomain', subdomain)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Main domain - show landing page or redirect
  if (!subdomain || subdomain === 'www') {
    // Allow public pages
    if (
      pathname === '/' ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static')
    ) {
      return NextResponse.next()
    }
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
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

