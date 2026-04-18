import { Redis } from 'ioredis'

// Redis client singleton
let redis: Redis | null = null

// Redis configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      return true
    }
    return false
  },
}

/**
 * Get Redis client instance (singleton pattern)
 */
export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_CONFIG)

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message)
    })

    redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...')
    })
  }

  return redis
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
    console.log('Redis connection closed')
  }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient()
    await client.ping()
    return true
  } catch (error) {
    console.error('Redis not available:', error)
    return false
  }
}

// Export Redis instance
export default getRedisClient
