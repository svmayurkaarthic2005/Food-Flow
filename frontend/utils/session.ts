import getRedisClient from '@/lib/redis'
import { CacheTTL } from './cache'

const SESSION_PREFIX = 'session'
const BLACKLIST_PREFIX = 'blacklist'

/**
 * Store session data in Redis
 */
export async function setSession(
  sessionId: string,
  data: any,
  ttl: number = CacheTTL.HOUR
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`
    await redis.setex(key, ttl, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Session set error:', error)
    return false
  }
}

/**
 * Get session data from Redis
 */
export async function getSession<T>(sessionId: string): Promise<T | null> {
  try {
    const redis = getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`
    const data = await redis.get(key)
    
    if (!data) return null
    
    return JSON.parse(data) as T
  } catch (error) {
    console.error('Session get error:', error)
    return null
  }
}

/**
 * Delete session from Redis
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Session delete error:', error)
    return false
  }
}

/**
 * Add token to blacklist (for logout/revocation)
 */
export async function blacklistToken(
  token: string,
  ttl: number = CacheTTL.DAY
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `${BLACKLIST_PREFIX}:${token}`
    await redis.setex(key, ttl, '1')
    return true
  } catch (error) {
    console.error('Token blacklist error:', error)
    return false
  }
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `${BLACKLIST_PREFIX}:${token}`
    const exists = await redis.exists(key)
    return exists === 1
  } catch (error) {
    console.error('Token blacklist check error:', error)
    return false
  }
}

/**
 * Extend session TTL
 */
export async function extendSession(
  sessionId: string,
  ttl: number = CacheTTL.HOUR
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `${SESSION_PREFIX}:${sessionId}`
    await redis.expire(key, ttl)
    return true
  } catch (error) {
    console.error('Session extend error:', error)
    return false
  }
}
