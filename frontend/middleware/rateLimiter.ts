import { NextRequest, NextResponse } from 'next/server'
import getRedisClient from '@/lib/redis'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

// Default rate limit: 100 requests per 15 minutes
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests, please try again later',
}

/**
 * Get client identifier (IP address)
 */
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
}

/**
 * Rate limiter using Redis
 */
export async function rateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { maxRequests, windowMs, message } = { ...DEFAULT_CONFIG, ...config }
  
  try {
    const redis = getRedisClient()
    const clientId = getClientId(request)
    const key = `ratelimit:${clientId}`
    
    // Get current count
    const current = await redis.get(key)
    const count = current ? parseInt(current) : 0
    
    // Check if limit exceeded
    if (count >= maxRequests) {
      const ttl = await redis.ttl(key)
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: Date.now() + ttl * 1000,
      }
    }
    
    // Increment counter
    const newCount = await redis.incr(key)
    
    // Set expiry on first request
    if (newCount === 1) {
      await redis.pexpire(key, windowMs)
    }
    
    const ttl = await redis.ttl(key)
    
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - newCount,
      reset: Date.now() + ttl * 1000,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if Redis is down
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: Date.now() + windowMs,
    }
  }
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: Partial<RateLimitConfig>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await rateLimit(request, config)
    
    // Add rate limit headers
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', result.limit.toString())
    headers.set('X-RateLimit-Remaining', result.remaining.toString())
    headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())
    
    if (!result.success) {
      const errorMessage = config?.message || DEFAULT_CONFIG.message
      return NextResponse.json(
        { error: errorMessage },
        { status: 429, headers }
      )
    }
    
    const response = await handler(request)
    
    // Add rate limit headers to response
    headers.forEach((value, key) => {
      response.headers.set(key, value)
    })
    
    return response
  }
}
