// CSRF (Cross-Site Request Forgery) protection
import { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'

const CSRF_TOKEN_LENGTH = 32
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_COOKIE_NAME = 'csrf-token'

// Generate a new CSRF token
export function generateCsrfToken(): string {
  return nanoid(CSRF_TOKEN_LENGTH)
}

// Validate CSRF token
export function validateCsrfToken(
  request: NextRequest,
  expectedToken: string
): boolean {
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

  // Token must be present in both header and cookie
  if (!headerToken || !cookieToken) {
    return false
  }

  // Tokens must match
  if (headerToken !== cookieToken || headerToken !== expectedToken) {
    return false
  }

  return true
}

// Check if request method requires CSRF protection
export function requiresCsrfProtection(method: string): boolean {
  // Only protect state-changing methods
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
}

// Get CSRF token from request
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null
}

export { CSRF_HEADER_NAME, CSRF_COOKIE_NAME }
