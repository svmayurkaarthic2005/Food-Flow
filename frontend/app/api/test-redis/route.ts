import { NextResponse } from 'next/server'
import getRedisClient from '@/lib/redis'
import { withCache, getCacheKey, CacheTTL, invalidateRouteCache } from '@/utils/cache'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  }

  try {
    // Test 1: Redis Connection
    results.tests.push({ name: 'Redis Connection', status: 'running' })
    const redis = getRedisClient()
    const pong = await redis.ping()
    results.tests[0].status = 'passed'
    results.tests[0].result = pong

    // Test 2: Basic SET/GET
    results.tests.push({ name: 'Basic SET/GET', status: 'running' })
    await redis.set('test:basic', 'Hello Redis!')
    const value = await redis.get('test:basic')
    results.tests[1].status = value === 'Hello Redis!' ? 'passed' : 'failed'
    results.tests[1].result = value

    // Test 3: Cache Key Generation
    results.tests.push({ name: 'Cache Key Generation', status: 'running' })
    const cacheKey = getCacheKey('listings', { status: 'AVAILABLE', page: 1 })
    results.tests[2].status = cacheKey.startsWith('foodflow:') ? 'passed' : 'failed'
    results.tests[2].result = cacheKey

    // Test 4: Cache-Aside Pattern
    results.tests.push({ name: 'Cache-Aside Pattern', status: 'running' })
    let dbCallCount = 0
    const fetchData = async () => {
      dbCallCount++
      return { data: 'from database', timestamp: Date.now() }
    }

    // First call - should hit database
    const result1 = await withCache('test:cache-aside', fetchData, CacheTTL.SHORT)
    // Second call - should hit cache
    const result2 = await withCache('test:cache-aside', fetchData, CacheTTL.SHORT)
    
    results.tests[3].status = dbCallCount === 1 ? 'passed' : 'failed'
    results.tests[3].result = {
      dbCalls: dbCallCount,
      firstCall: result1,
      secondCall: result2,
      cacheWorking: dbCallCount === 1,
    }

    // Test 5: TTL (Time To Live)
    results.tests.push({ name: 'TTL Configuration', status: 'running' })
    await redis.setex('test:ttl', 5, 'expires in 5 seconds')
    const ttl = await redis.ttl('test:ttl')
    results.tests[4].status = ttl > 0 && ttl <= 5 ? 'passed' : 'failed'
    results.tests[4].result = { ttl, message: `Expires in ${ttl} seconds` }

    // Test 6: Pattern Matching
    results.tests.push({ name: 'Pattern Matching', status: 'running' })
    await redis.set('foodflow:test:1', 'value1')
    await redis.set('foodflow:test:2', 'value2')
    const keys = await redis.keys('foodflow:test:*')
    results.tests[5].status = keys.length >= 2 ? 'passed' : 'failed'
    results.tests[5].result = { keysFound: keys.length, keys }

    // Test 7: Cache Invalidation
    results.tests.push({ name: 'Cache Invalidation', status: 'running' })
    const deletedCount = await invalidateRouteCache('test')
    results.tests[6].status = 'passed'
    results.tests[6].result = { deletedKeys: deletedCount }

    // Test 8: Increment (Rate Limiting)
    results.tests.push({ name: 'INCR (Rate Limiting)', status: 'running' })
    const rateKey = 'ratelimit:test-api'
    await redis.del(rateKey) // Clear first
    await redis.incr(rateKey)
    await redis.incr(rateKey)
    await redis.incr(rateKey)
    const count = await redis.get(rateKey)
    results.tests[7].status = count === '3' ? 'passed' : 'failed'
    results.tests[7].result = { count: parseInt(count || '0') }

    // Cleanup
    await redis.del('test:basic', 'test:cache-aside', 'test:ttl', rateKey)

    // Summary
    const passedTests = results.tests.filter((t: any) => t.status === 'passed').length
    const totalTests = results.tests.length

    results.summary = {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      status: passedTests === totalTests ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED',
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Redis test failed',
        message: error.message,
        results,
      },
      { status: 500 }
    )
  }
}
