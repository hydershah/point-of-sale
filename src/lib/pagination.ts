// Cursor-based pagination utilities for better performance with large datasets

export interface PaginationParams {
  cursor?: string
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  previousCursor: string | null
  hasMore: boolean
  total?: number
}

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Encode cursor (base64)
export function encodeCursor(value: string): string {
  return Buffer.from(value).toString('base64')
}

// Decode cursor (base64)
export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8')
}

// Parse pagination params from request
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const cursor = searchParams.get('cursor') || undefined
  const limitParam = searchParams.get('limit')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  let limit = DEFAULT_PAGE_SIZE
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_PAGE_SIZE)
    }
  }

  return {
    cursor,
    limit,
    sortBy,
    sortOrder,
  }
}

// Build Prisma cursor query
export function buildCursorQuery<T extends Record<string, any>>(
  params: PaginationParams,
  additionalWhere?: T
) {
  const { cursor, limit = DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc' } = params

  const query: any = {
    take: limit + 1, // Fetch one extra to determine if there are more results
    orderBy: { [sortBy]: sortOrder },
    where: additionalWhere || {},
  }

  if (cursor) {
    const decodedCursor = decodeCursor(cursor)
    query.cursor = { id: decodedCursor }
    query.skip = 1 // Skip the cursor itself
  }

  return query
}

// Process paginated results
export function processPaginatedResults<T extends { id: string }>(
  results: T[],
  limit: number
): {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
} {
  const hasMore = results.length > limit
  const data = hasMore ? results.slice(0, limit) : results

  const nextCursor =
    hasMore && data.length > 0
      ? encodeCursor(data[data.length - 1].id)
      : null

  return {
    data,
    nextCursor,
    hasMore,
  }
}

// Build complete paginated response
export function buildPaginatedResponse<T extends { id: string }>(
  results: T[],
  params: PaginationParams,
  total?: number
): PaginatedResponse<T> {
  const limit = params.limit || DEFAULT_PAGE_SIZE
  const { data, nextCursor, hasMore } = processPaginatedResults(results, limit)

  return {
    data,
    nextCursor,
    previousCursor: params.cursor || null,
    hasMore,
    ...(total !== undefined && { total }),
  }
}

// Offset-based pagination (fallback for non-cursor queries)
export interface OffsetPaginationParams {
  page?: number
  limit?: number
}

export interface OffsetPaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export function parseOffsetPaginationParams(
  searchParams: URLSearchParams
): OffsetPaginationParams {
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')

  let page = 1
  if (pageParam) {
    const parsed = parseInt(pageParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      page = parsed
    }
  }

  let limit = DEFAULT_PAGE_SIZE
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_PAGE_SIZE)
    }
  }

  return { page, limit }
}

export function buildOffsetPaginatedResponse<T>(
  data: T[],
  total: number,
  params: OffsetPaginationParams
): OffsetPaginatedResponse<T> {
  const page = params.page || 1
  const limit = params.limit || DEFAULT_PAGE_SIZE
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    data,
    page,
    limit,
    total,
    totalPages,
    hasMore,
  }
}

// Calculate skip and take for Prisma offset queries
export function getOffsetPaginationQuery(params: OffsetPaginationParams) {
  const page = params.page || 1
  const limit = params.limit || DEFAULT_PAGE_SIZE

  return {
    skip: (page - 1) * limit,
    take: limit,
  }
}
