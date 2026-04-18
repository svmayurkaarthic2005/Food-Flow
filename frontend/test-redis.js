// Redis Connection Test Script
const Redis = require('ioredis');

console.log('🧪 Testing Redis Integration...\n');

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    if (times > 3) {
      console.log('❌ Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 50, 2000);
  },
});

async function testRedis() {
  try {
    // Test 1: Connection
    console.log('Test 1: Testing Redis connection...');
    const pong = await redis.ping();
    console.log(`✅ Redis connection successful: ${pong}\n`);

    // Test 2: Set and Get
    console.log('Test 2: Testing SET and GET operations...');
    await redis.set('test:key', 'Hello Redis!');
    const value = await redis.get('test:key');
    console.log(`✅ SET/GET working: ${value}\n`);

    // Test 3: Set with TTL
    console.log('Test 3: Testing SET with TTL (5 seconds)...');
    await redis.setex('test:ttl', 5, 'This will expire');
    const ttlValue = await redis.get('test:ttl');
    const ttl = await redis.ttl('test:ttl');
    console.log(`✅ TTL working: value="${ttlValue}", expires in ${ttl}s\n`);

    // Test 4: Cache Key Pattern
    console.log('Test 4: Testing cache key pattern...');
    const cacheKey = 'foodflow:listings:{"status":"AVAILABLE","page":1}';
    const cacheData = { data: [{ id: 1, name: 'Test Listing' }], total: 1 };
    await redis.setex(cacheKey, 60, JSON.stringify(cacheData));
    const cachedValue = await redis.get(cacheKey);
    const parsed = JSON.parse(cachedValue);
    console.log(`✅ Cache pattern working: ${JSON.stringify(parsed)}\n`);

    // Test 5: Pattern Matching
    console.log('Test 5: Testing pattern matching...');
    await redis.set('foodflow:test1', 'value1');
    await redis.set('foodflow:test2', 'value2');
    await redis.set('foodflow:test3', 'value3');
    const keys = await redis.keys('foodflow:*');
    console.log(`✅ Pattern matching working: Found ${keys.length} keys`);
    console.log(`   Keys: ${keys.join(', ')}\n`);

    // Test 6: Delete Pattern
    console.log('Test 6: Testing pattern deletion...');
    const deletedCount = await redis.del(...keys);
    console.log(`✅ Pattern deletion working: Deleted ${deletedCount} keys\n`);

    // Test 7: Increment (for rate limiting)
    console.log('Test 7: Testing INCR (rate limiting)...');
    const rateKey = 'ratelimit:test-ip';
    await redis.incr(rateKey);
    await redis.incr(rateKey);
    await redis.incr(rateKey);
    const count = await redis.get(rateKey);
    console.log(`✅ INCR working: count=${count}\n`);

    // Test 8: Pub/Sub
    console.log('Test 8: Testing Pub/Sub...');
    const subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    await new Promise((resolve) => {
      subscriber.subscribe('test-channel', (err) => {
        if (err) {
          console.log('❌ Subscribe failed:', err);
        } else {
          console.log('✅ Subscribed to test-channel');
        }
      });

      subscriber.on('message', (channel, message) => {
        console.log(`✅ Received message on ${channel}: ${message}\n`);
        subscriber.quit();
        resolve();
      });

      // Publish after a short delay
      setTimeout(() => {
        redis.publish('test-channel', 'Hello from publisher!');
      }, 100);
    });

    // Test 9: Check Memory
    console.log('Test 9: Checking Redis memory usage...');
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    if (memoryMatch) {
      console.log(`✅ Memory usage: ${memoryMatch[1]}\n`);
    }

    // Test 10: Database Size
    console.log('Test 10: Checking database size...');
    const dbsize = await redis.dbsize();
    console.log(`✅ Database size: ${dbsize} keys\n`);

    // Cleanup
    console.log('Cleaning up test keys...');
    await redis.del('test:key', 'test:ttl', rateKey);
    const cleanupKeys = await redis.keys('foodflow:*');
    if (cleanupKeys.length > 0) {
      await redis.del(...cleanupKeys);
    }
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All Redis tests passed successfully!\n');
    console.log('Redis Integration Status: ✅ WORKING\n');
    console.log('You can now use Redis caching in your application.');

  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.log('\n⚠️  Redis is not running or not accessible.');
    console.log('To start Redis:');
    console.log('  Windows: redis-server');
    console.log('  macOS: brew services start redis');
    console.log('  Linux: sudo systemctl start redis');
  } finally {
    redis.quit();
    process.exit(0);
  }
}

// Handle connection events
redis.on('connect', () => {
  console.log('🔌 Connecting to Redis...');
});

redis.on('ready', () => {
  console.log('✅ Redis client ready\n');
  testRedis();
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
  console.log('\n⚠️  Make sure Redis is installed and running.');
  console.log('Installation:');
  console.log('  Windows: choco install redis-64');
  console.log('  macOS: brew install redis');
  console.log('  Linux: sudo apt-get install redis-server');
  process.exit(1);
});

redis.on('close', () => {
  console.log('🔌 Redis connection closed');
});
