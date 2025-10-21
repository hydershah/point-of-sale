/**
 * API Middleware
 *
 * Centralized middleware for API routes including:
 * - Authentication
 * - Authorization
 * - Input validation
 * - Error handling
 * - Logging
 * - Rate limiting
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logger } from "@/lib/logger"
// import { rateLimit } from "@/lib/security/rate-limit" // TODO: Implement rate limiting
import { sanitizeText } from "@/lib/security/sanitize"
import { z } from "zod"
import { validate, type ValidationResult } from "@/lib/validation/schemas"

// ========================================
// TYPES
// ========================================

export interface ApiContext {
  req: NextRequest
  session: {
    user: {
      id: string
      email: string
      name: string
      role: string
      tenantId: string
    }
  }
  params?: Record<string, string>
  body?: unknown
  searchParams?: URLSearchParams
}

export type ApiHandler<T = unknown> = (
  context: ApiContext
) => Promise<NextResponse<T>> | NextResponse<T>

export interface MiddlewareOptions {
  requireAuth?: boolean
  requireRoles?: string[]
  validateBody?: z.ZodSchema
  validateParams?: z.ZodSchema
  validateQuery?: z.ZodSchema
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
  sanitizeBody?: boolean
  tenantIsolation?: boolean
}

// ========================================
// ERROR RESPONSES
// ========================================

export function errorResponse(message: string, status: number = 500, details?: unknown): NextResponse {
  logger.error("API Error", new Error(message), { status, details })

  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV === "development" && details ? { details } : {}),
    },
    { status }
  )
}

export function validationErrorResponse(errors: Record<string, string[]>): NextResponse {
  return NextResponse.json(
    {
      error: "Validation failed",
      errors,
    },
    { status: 400 }
  )
}

export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message: string = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function notFoundResponse(message: string = "Resource not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function tooManyRequestsResponse(message: string = "Too many requests"): NextResponse {
  return NextResponse.json({ error: message }, { status: 429 })
}

// ========================================
// MIDDLEWARE WRAPPER
// ========================================

/**
 * Wraps an API handler with middleware
 */
export function withMiddleware(handler: ApiHandler, options: MiddlewareOptions = {}) {
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    const startTime = Date.now()
    const method = req.method
    const path = req.nextUrl.pathname

    try {
      // Log incoming request
      logger.apiRequest(method, path, {
        ip: req.ip || req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      })

      // Rate limiting
      // TODO: Implement rate limiting
      // if (options.rateLimit) {
      //   const identifier = req.ip || req.headers.get("x-forwarded-for") || "unknown"
      //   const limiter = rateLimit({
      //     uniqueTokenPerInterval: 500,
      //     interval: options.rateLimit.windowMs,
      //   })

      //   try {
      //     await limiter.check(options.rateLimit.maxRequests, identifier)
      //   } catch {
      //     logger.securityEvent("Rate limit exceeded", "medium", { ip: identifier, path })
      //     return tooManyRequestsResponse()
      //   }
      // }

      // Authentication
      let session = null
      if (options.requireAuth) {
        session = await getServerSession(authOptions)

        if (!session?.user) {
          logger.securityEvent("Unauthorized access attempt", "medium", { path })
          return unauthorizedResponse()
        }

        // Log authentication
        logger.authEvent("Authenticated request", session.user.id, true, { path, method })
      }

      // Authorization (role check)
      if (options.requireRoles && session) {
        const userRole = session.user.role
        if (!options.requireRoles.includes(userRole)) {
          logger.securityEvent("Forbidden access attempt", "medium", {
            userId: session.user.id,
            userRole,
            requiredRoles: options.requireRoles,
            path,
          })
          return forbiddenResponse(`Access denied. Required roles: ${options.requireRoles.join(", ")}`)
        }
      }

      // Parse request body for POST, PUT, PATCH
      let body: unknown = null
      if (["POST", "PUT", "PATCH"].includes(method)) {
        try {
          const text = await req.text()
          body = text ? JSON.parse(text) : null
        } catch (error) {
          return errorResponse("Invalid JSON in request body", 400)
        }

        // Sanitize body
        if (options.sanitizeBody && body && typeof body === "object") {
          body = sanitizeObject(body)
        }

        // Validate body
        if (options.validateBody && body) {
          const result = validate(options.validateBody, body)
          if (!result.success) {
            return validationErrorResponse(result.error.errors)
          }
          body = result.data
        }
      }

      // Parse and validate query parameters
      const searchParams = req.nextUrl.searchParams
      if (options.validateQuery) {
        const queryData: Record<string, unknown> = {}
        searchParams.forEach((value, key) => {
          // Auto-convert query params
          if (!isNaN(Number(value))) {
            queryData[key] = Number(value)
          } else if (value === "true" || value === "false") {
            queryData[key] = value === "true"
          } else {
            queryData[key] = value
          }
        })

        const result = validate(options.validateQuery, queryData)
        if (!result.success) {
          return validationErrorResponse(result.error.errors)
        }
      }

      // Validate route params
      if (options.validateParams && context?.params) {
        const result = validate(options.validateParams, context.params)
        if (!result.success) {
          return validationErrorResponse(result.error.errors)
        }
      }

      // Tenant isolation check
      if (options.tenantIsolation && session) {
        if (!session.user.tenantId) {
          logger.securityEvent("Missing tenant ID", "high", { userId: session.user.id })
          return forbiddenResponse("Tenant isolation error")
        }
      }

      // Build context
      const apiContext: ApiContext = {
        req,
        session: session as any,
        params: context?.params,
        body,
        searchParams,
      }

      // Call handler
      const response = await handler(apiContext)

      // Log response
      const duration = Date.now() - startTime
      const status = response.status
      logger.apiResponse(method, path, status, duration, {
        userId: session?.user?.id,
        tenantId: session?.user?.tenantId,
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error("API Handler Error", error instanceof Error ? error : new Error(String(error)), {
        method,
        path,
        duration,
      })

      return errorResponse(
        error instanceof Error ? error.message : "Internal server error",
        500,
        process.env.NODE_ENV === "development" ? error : undefined
      )
    }
  }
}

/**
 * Sanitizes an object recursively
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeText(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => (typeof item === "object" && item !== null ? sanitizeObject(item as Record<string, unknown>) : item))
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result
}

// ========================================
// CONVENIENCE WRAPPERS
// ========================================

/**
 * Wrapper for public endpoints (no auth required)
 */
export function publicHandler(handler: ApiHandler, options: Omit<MiddlewareOptions, "requireAuth"> = {}) {
  return withMiddleware(handler, { ...options, requireAuth: false })
}

/**
 * Wrapper for authenticated endpoints
 */
export function authHandler(handler: ApiHandler, options: Omit<MiddlewareOptions, "requireAuth"> = {}) {
  return withMiddleware(handler, { ...options, requireAuth: true, tenantIsolation: true })
}

/**
 * Wrapper for admin-only endpoints
 */
export function adminHandler(handler: ApiHandler, options: Omit<MiddlewareOptions, "requireAuth" | "requireRoles"> = {}) {
  return withMiddleware(handler, {
    ...options,
    requireAuth: true,
    requireRoles: ["BUSINESS_ADMIN"],
    tenantIsolation: true,
  })
}

/**
 * Wrapper for manager-level endpoints
 */
export function managerHandler(handler: ApiHandler, options: Omit<MiddlewareOptions, "requireAuth" | "requireRoles"> = {}) {
  return withMiddleware(handler, {
    ...options,
    requireAuth: true,
    requireRoles: ["BUSINESS_ADMIN", "MANAGER"],
    tenantIsolation: true,
  })
}

/**
 * Wrapper for super admin endpoints
 */
export function superAdminHandler(handler: ApiHandler, options: Omit<MiddlewareOptions, "requireAuth"> = {}) {
  // Note: Super admin auth check needs to be implemented differently
  // as they don't have tenantId
  return withMiddleware(handler, { ...options, requireAuth: true, tenantIsolation: false })
}

// ========================================
// RESPONSE HELPERS
// ========================================

export function successResponse<T>(data: T, status: number = 200): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status })
}

export function createdResponse<T>(data: T): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status: 201 })
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<{ data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
