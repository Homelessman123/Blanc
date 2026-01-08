/**
 * ============================================================================
 * REDIS CACHE UTILITY
 * ============================================================================
 * 
 * Provides Redis-based caching with:
 * - Get/set operations with TTL
 * - Namespace support
 * - Automatic serialization/deserialization
 * - Graceful fallback if Redis is unavailable
 * - Connection pooling
 * 
 * Usage:
 *   import { getCached, invalidate } from './cache.js';
 *   
 *   const data = await getCached('contests:all', async () => {
 *     return await contestsCollection.find().toArray();
 *   }, 600); // 10 minutes TTL
 */

import Redis from 'ioredis';

let redis = null;
let isRedisAvailable = false;

function normalizeRedisUrl(value) {
    if (!value) return value;
    const trimmed = String(value).trim();

    // Common template placeholders (GitHub Actions/Railway-like) that indicate the value
    // was not expanded at runtime.
    if (trimmed.includes('${{') || trimmed.includes('}}')) {
        return '';
    }

    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

/**
 * Initialize Redis connection with Railway-optimized settings
 */
function initRedis() {
    if (redis) return redis;

    const isProduction = process.env.NODE_ENV === 'production';
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

    const redisUrl = normalizeRedisUrl(process.env.REDIS_URL || process.env.REDIS_URI);

    if (!redisUrl) {
        console.warn('⚠️ Redis URL not configured, caching will be disabled');
        return null;
    }

    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            connectTimeout: isProduction ? 10000 : 5000, // 10s for prod, 5s for dev
            commandTimeout: isProduction ? 5000 : 3000,  // 5s for prod, 3s for dev
            retryStrategy: (times) => {
                // Stop retrying after 3 attempts
                if (times > 3) {
                    if (!isProduction) {
                        console.warn('⚠️ Redis connection failed after 3 attempts, disabling cache');
                    }
                    isRedisAvailable = false;
                    return null; // Stop retrying
                }
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true; // Reconnect on READONLY error
                }
                return false;
            },
            lazyConnect: true, // Don't connect immediately
            enableOfflineQueue: false, // Don't queue commands when offline
            enableReadyCheck: true,
            keepAlive: isProduction ? 30000 : 0, // Keep-alive for production
            family: 4, // Force IPv4 (Railway compatibility)
        });

        redis.on('connect', () => {
            console.log('✅ Redis connected');
            isRedisAvailable = true;
        });

        redis.on('error', (err) => {
            console.error('❌ Redis error:', err.message || err);
            isRedisAvailable = false;
            // Don't let Redis errors crash the app
        });

        redis.on('close', () => {
            console.warn('⚠️ Redis connection closed');
            isRedisAvailable = false;
        });

        // Try to connect once, but don't block if it fails
        redis.connect().catch((err) => {
            console.warn('⚠️ Redis initial connection failed, caching disabled:', err.message);
            isRedisAvailable = false;
        });

        return redis;
    } catch (err) {
        console.error('Failed to initialize Redis:', err.message || err);
        isRedisAvailable = false;
        return null;
    }
}

export async function checkRedisHealth(timeoutMs = 5000) {
    const client = initRedis();
    if (!client) return false;

    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis healthcheck timeout')), timeoutMs)
        );
        await Promise.race([client.ping(), timeoutPromise]);
        isRedisAvailable = true;
        return true;
    } catch (err) {
        const message = String(err?.message || err || '').slice(0, 300);
        if (message) {
            console.warn('⚠️ Redis healthcheck failed:', message);
        }
        isRedisAvailable = false;
        return false;
    }
}

/**
 * Get cached data or fetch and cache
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<any>} Cached or freshly fetched data
 */
export async function getCached(key, fetcher, ttl = 300) {
    const client = initRedis();

    // If Redis is not available, always fetch fresh
    if (!client || !isRedisAvailable) {
        return await fetcher();
    }

    try {
        // Try to get from cache
        const cached = await client.get(key);
        if (cached) {
            return JSON.parse(cached);
        }

        // Not in cache, fetch fresh data
        const data = await fetcher();

        // Store in cache with TTL
        await client.setex(key, ttl, JSON.stringify(data));

        return data;
    } catch (err) {
        console.error('Cache error:', err);
        // On cache error, fetch fresh data
        return await fetcher();
    }
}

/**
 * Set cache value explicitly
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export async function setCache(key, value, ttl = 300) {
    const client = initRedis();
    if (!client || !isRedisAvailable) return;

    try {
        await client.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
        console.error('Failed to set cache:', err);
    }
}

/**
 * Invalidate cache by key or pattern
 * @param {string} keyOrPattern - Cache key or pattern (e.g., "contests:*")
 */
export async function invalidate(keyOrPattern) {
    const client = initRedis();
    if (!client || !isRedisAvailable) return;

    try {
        if (keyOrPattern.includes('*')) {
            // Pattern-based deletion (SCAN to avoid blocking Redis like KEYS)
            let cursor = '0';
            do {
                const [nextCursor, keys] = await client.scan(
                    cursor,
                    'MATCH',
                    keyOrPattern,
                    'COUNT',
                    '200'
                );
                cursor = nextCursor;
                if (Array.isArray(keys) && keys.length > 0) {
                    await client.del(...keys);
                }
            } while (cursor !== '0');
        } else {
            // Single key deletion
            await client.del(keyOrPattern);
        }
    } catch (err) {
        console.error('Failed to invalidate cache:', err);
    }
}

/**
 * Clear all cache
 */
export async function clearAll() {
    const client = initRedis();
    if (!client || !isRedisAvailable) return;

    try {
        await client.flushdb();
        console.log('✅ Cache cleared');
    } catch (err) {
        console.error('Failed to clear cache:', err);
    }
}

/**
 * Check if Redis is available
 */
export function isAvailable() {
    return isRedisAvailable;
}

/**
 * Disconnect from Redis
 */
export async function disconnect() {
    if (redis) {
        await redis.quit();
        redis = null;
        isRedisAvailable = false;
    }
}

export default {
    getCached,
    setCache,
    invalidate,
    clearAll,
    isAvailable,
    disconnect,
};
