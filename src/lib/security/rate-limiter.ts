// Rate limiting middleware to prevent API abuse
import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  payment: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
}

// Get client identifier (IP address or user ID)
function getClientId(request: NextRequest): string {
  // Try to get IP from various headers (for proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || real || 'unknown'

  return ip
}

// Check rate limit for a client
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.default
): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
}> {
  const clientId = getClientId(request)
  const key = `ratelimit:${clientId}:${request.nextUrl.pathname}`

  // If Redis is not available, allow the request
  if (!redis) {
    return { allowed: true, remaining: config.maxRequests, resetTime: 0 }
  }

  try {
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Get current count
    const count = await redis.get<number>(key)
    const currentCount = count || 0

    if (currentCount >= config.maxRequests) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key)
      const resetTime = now + ttl * 1000

      return {
        allowed: false,
        remaining: 0,
        resetTime,
      }
    }

    // Increment counter
    if (currentCount === 0) {
      // First request in window, set expiry
      await redis.setex(key, Math.floor(config.windowMs / 1000), 1)
    } else {
      await redis.incr(key)
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetTime: now + config.windowMs,
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // On error, allow the request
    return { allowed: true, remaining: config.maxRequests, resetTime: 0 }
  }
}

// Rate limit middleware
export async function rateLimitMiddleware(
  request: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, config)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        resetTime: new Date(result.resetTime).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config?.maxRequests.toString() || '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil(
            (result.resetTime - Date.now()) / 1000
          ).toString(),
        },
      }
    )
  }

  // Request allowed, continue
  return null
}

// Helper to add rate limit headers to response
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())

  return response
}
