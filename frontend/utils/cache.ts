import getRedisClient from '@/lib/redis'

// Cache key prefix for the application
const CACHE_PREFIX = 'foodflow'

// Default TTL values (in seconds)
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
}

/**
 * Generate cache key with prefix
 */
export function getCacheKey(route: string, params?: Record<string, any>): string {
  const paramString = params ? `:${JSON.stringify(params)}` : ''
  return `${CACHE_PREFIX}:${route}${paramString}`
}

/**
 * Get cached data
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient()
    const data = await redis.get(key)
    
    if (!data) return null
    
    return JSON.parse(data) as T
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set cache data with TTL
 */
export async function setCache(
  key: string,
  data: any,
  ttl: number = CacheTTL.MEDIUM
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const serialized = JSON.stringify(data)
    await redis.setex(key, ttl, serialized)
    return true
  } catch (error) {
    console.error('Cache set error:', error)
    return false
  }
}

/**
 * Delete cache by key
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Cache delete error:', error)
    return false
  }
}

/**
 * Delete cache by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys(`${CACHE_PREFIX}:${pattern}*`)
    
    if (keys.length === 0) return 0
    
    await redis.del(...keys)
    return keys.length
  } catch (error) {
    console.error('Cache pattern delete error:', error)
    return 0
  }
}

/**
 * Cache wrapper for API responses
 * Implements cache-aside pattern
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key)
  if (cached !== null) {
    console.log(`✅ Cache HIT: ${key}`)
    return cached
  }

  console.log(`❌ Cache MISS: ${key}`)
  
  // Fetch from source
  const data = await fetcher()
  
  // Store in cache (fire and forget)
  setCache(key, data, ttl).catch((err) => {
    console.error('Failed to cache data:', err)
  })
  
  return data
}

/**
 * Invalidate cache for a specific route
 */
export async function invalidateRouteCache(route: string): Promise<void> {
  await deleteCachePattern(route)
  console.log(`🗑️  Invalidated cache for route: ${route}`)
}
