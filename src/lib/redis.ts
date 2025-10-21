// Redis caching layer for improved performance
// TODO: Install @upstash/redis package for caching
// import { Redis } from '@upstash/redis'

// Initialize Redis client
// Using Upstash Redis for serverless-friendly caching
// Temporarily disabled until @upstash/redis is installed
const redis = null
// const redis = process.env.REDIS_URL
//   ? new Redis({
//       url: process.env.REDIS_URL,
//       token: process.env.REDIS_TOKEN || '',
//     })
//   : null

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  PRODUCTS: 60 * 5, // 5 minutes
  CATEGORIES: 60 * 10, // 10 minutes
  SETTINGS: 60 * 15, // 15 minutes
  ORDERS: 60 * 2, // 2 minutes
  CUSTOMERS: 60 * 5, // 5 minutes
}

// Cache key generators
export const CacheKeys = {
  products: (tenantId: string) => `tenant:${tenantId}:products`,
  productById: (tenantId: string, productId: string) =>
    `tenant:${tenantId}:product:${productId}`,
  productsByCategory: (tenantId: string, categoryId: string) =>
    `tenant:${tenantId}:category:${categoryId}:products`,
  categories: (tenantId: string) => `tenant:${tenantId}:categories`,
  settings: (tenantId: string) => `tenant:${tenantId}:settings`,
  customers: (tenantId: string) => `tenant:${tenantId}:customers`,
  customerById: (tenantId: string, customerId: string) =>
    `tenant:${tenantId}:customer:${customerId}`,
  recentOrders: (tenantId: string) => `tenant:${tenantId}:orders:recent`,
}

// Generic cache get function
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null

  try {
    const data = await redis.get<T>(key)
    return data
  } catch (error) {
    console.error('Redis GET error:', error)
    return null
  }
}

// Generic cache set function
export async function cacheSet<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.PRODUCTS
): Promise<void> {
  if (!redis) return

  try {
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.error('Redis SET error:', error)
  }
}

// Generic cache delete function
export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return

  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis DELETE error:', error)
  }
}

// Delete multiple keys with pattern
export async function cacheDeletePattern(pattern: string): Promise<void> {
  if (!redis) return

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis DELETE PATTERN error:', error)
  }
}

// Invalidate all tenant cache
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  await cacheDeletePattern(`tenant:${tenantId}:*`)
}

// Invalidate product cache
export async function invalidateProductCache(
  tenantId: string,
  productId?: string
): Promise<void> {
  if (productId) {
    await cacheDelete(CacheKeys.productById(tenantId, productId))
  }
  await cacheDelete(CacheKeys.products(tenantId))
  await cacheDeletePattern(`tenant:${tenantId}:category:*:products`)
}

// Invalidate category cache
export async function invalidateCategoryCache(tenantId: string): Promise<void> {
  await cacheDelete(CacheKeys.categories(tenantId))
  await cacheDeletePattern(`tenant:${tenantId}:category:*`)
}

// Invalidate customer cache
export async function invalidateCustomerCache(
  tenantId: string,
  customerId?: string
): Promise<void> {
  if (customerId) {
    await cacheDelete(CacheKeys.customerById(tenantId, customerId))
  }
  await cacheDelete(CacheKeys.customers(tenantId))
}

// Invalidate settings cache
export async function invalidateSettingsCache(tenantId: string): Promise<void> {
  await cacheDelete(CacheKeys.settings(tenantId))
}

// Cache wrapper for database queries
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key)
  if (cached !== null) {
    return cached
  }

  // If not in cache, fetch from database
  const data = await fetcher()

  // Store in cache for next time
  await cacheSet(key, data, ttl)

  return data
}

export { redis, CACHE_TTL }
