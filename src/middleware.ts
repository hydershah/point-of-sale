import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

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

  // Super Admin Panel Routing
  if (subdomain === 'admin' || pathname.startsWith('/super-admin')) {
    requestHeaders.set('x-super-admin', 'true')
  }

  // Tenant Routing
  if (subdomain && subdomain !== 'www') {
    requestHeaders.set('x-tenant-subdomain', subdomain)
  }

  // Create response with updated headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // ========================================
  // ADD SECURITY HEADERS TO ALL RESPONSES
  // ========================================

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection (legacy but still good to have)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy - don't leak information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy - restrict browser features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Strict Transport Security - Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )

    // Content Security Policy in production
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  }

  // CORS for API routes
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = getAllowedOrigins()

    if (origin && allowedOrigins.some(allowed => matchesOrigin(origin, allowed))) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
  }

  return response
}

/**
 * Gets list of allowed CORS origins from environment
 */
function getAllowedOrigins(): string[] {
  const appDomain = process.env.APP_DOMAIN || 'localhost:3000'
  const nodeEnv = process.env.NODE_ENV

  if (nodeEnv === 'development') {
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      `http://${appDomain}`,
      `https://${appDomain}`,
    ]
  }

  return [
    `https://${appDomain}`,
    `https://*.${appDomain}`,
  ]
}

/**
 * Checks if an origin matches an allowed origin pattern
 */
function matchesOrigin(origin: string, allowed: string): boolean {
  if (allowed === origin) return true
  if (allowed.includes('*')) {
    const pattern = allowed.replace('*', '[a-z0-9-]+')
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(origin)
  }
  return false
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

