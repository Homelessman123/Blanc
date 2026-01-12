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

const DEFAULT_MEMORY_MAX_ENTRIES = 1000;
const memoryMaxEntriesRaw = Number.parseInt(process.env.CACHE_MEMORY_MAX_ENTRIES || '', 10);
const MEMORY_MAX_ENTRIES =
    Number.isFinite(memoryMaxEntriesRaw) && memoryMaxEntriesRaw >= 0
        ? memoryMaxEntriesRaw
        : DEFAULT_MEMORY_MAX_ENTRIES;

const memoryCache = new Map(); // key -> { value, expiresAtMs }
const inFlightRequests = new Map(); // key -> Promise
const keyGenerations = new Map(); // key -> number
let memoryCleanupCounter = 0;

function bumpGeneration(key) {
    const next = (keyGenerations.get(key) || 0) + 1;
    keyGenerations.set(key, next);
    return next;
}

function getGeneration(key) {
    return keyGenerations.get(key) || 0;
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globPatternToRegex(pattern) {
    const escaped = escapeRegExp(pattern).replace(/\\\*/g, '.*');
    return new RegExp(`^${escaped}$`);
}

function pruneMemoryCache() {
    if (MEMORY_MAX_ENTRIES === 0) {
        memoryCache.clear();
        return;
    }

    memoryCleanupCounter += 1;
    if (memoryCleanupCounter >= 50) {
        memoryCleanupCounter = 0;
        const now = Date.now();
        for (const [key, entry] of memoryCache.entries()) {
            if (!entry || entry.expiresAtMs <= now) {
                memoryCache.delete(key);
            }
        }
    }

    while (memoryCache.size > MEMORY_MAX_ENTRIES) {
        const oldestKey = memoryCache.keys().next().value;
        if (!oldestKey) break;
        memoryCache.delete(oldestKey);
    }
}

function getMemoryCache(key) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAtMs) {
        memoryCache.delete(key);
        return null;
    }
    return entry.value;
}

function setMemoryCache(key, value, ttlSeconds) {
    if (MEMORY_MAX_ENTRIES === 0) return;
    const ttlMs = Math.max(0, Number(ttlSeconds) || 0) * 1000;
    const expiresAtMs = Date.now() + ttlMs;
    memoryCache.set(key, { value, expiresAtMs });
    pruneMemoryCache();
}

function invalidateMemoryCache(keyOrPattern) {
    if (!keyOrPattern) return;

    if (keyOrPattern.includes('*')) {
        const regex = globPatternToRegex(keyOrPattern);

        for (const key of memoryCache.keys()) {
            if (regex.test(key)) {
                memoryCache.delete(key);
                bumpGeneration(key);
            }
        }

        for (const key of inFlightRequests.keys()) {
            if (regex.test(key)) {
                bumpGeneration(key);
                inFlightRequests.delete(key);
            }
        }

        return;
    }

    memoryCache.delete(keyOrPattern);
    bumpGeneration(keyOrPattern);
    inFlightRequests.delete(keyOrPattern);
}

export function normalizeRedisUrl(value) {
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

function coerceRedisUrl(value) {
    const normalized = normalizeRedisUrl(value);
    if (!normalized) return '';

    // ioredis supports redis://, rediss:// and unix://
    if (/^(redis|rediss|unix):\/\//i.test(normalized)) {
        return normalized;
    }

    // If it looks like host:port or user:pass@host:port, add redis:// prefix
    // Railway format: redis://default:xxx@redis.railway.internal:6379
    if (/^[a-zA-Z0-9_-]+:[^/]/.test(normalized)) {
        return `redis://${normalized}`;
    }

    return normalized;
}

function parseBoolean(value) {
    if (value === undefined || value === null) return undefined;
    const v = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
    return undefined;
}

function safeParseUrl(urlString) {
    try {
        return new URL(urlString);
    } catch {
        return null;
    }
}

function parseRedisFamily(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return undefined;
    const n = Number.parseInt(raw, 10);
    if (n === 4 || n === 6) return n;
    return undefined;
}

/**
 * Initialize Redis connection with Railway-optimized settings
 */
function initRedis() {
    if (redis) return redis;

    const isProduction = process.env.NODE_ENV === 'production';

    const redisUrl = coerceRedisUrl(process.env.REDIS_URL || process.env.REDIS_URI);

    if (!redisUrl) {
        console.warn('⚠️ Redis URL not configured, caching will be disabled');
        return null;
    }

    // Log sanitized URL for debugging (hide password)
    const sanitizedUrl = redisUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    console.log(`🔗 Initializing Redis: ${sanitizedUrl}`);

    try {
        const parsedUrl = safeParseUrl(redisUrl);
        const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
        const isTlsFromScheme = parsedUrl?.protocol === 'rediss:';
        const forceTls = parseBoolean(process.env.REDIS_TLS);
        const useTls = forceTls ?? isTlsFromScheme;

        const enableReadyCheckEnv = parseBoolean(process.env.REDIS_ENABLE_READY_CHECK);
        const enableReadyCheck = enableReadyCheckEnv ?? true;

        const maxConnectAttemptsEnv = Number(process.env.REDIS_MAX_CONNECT_ATTEMPTS || '');
        const maxConnectAttempts = Number.isFinite(maxConnectAttemptsEnv) && maxConnectAttemptsEnv >= 0
            ? maxConnectAttemptsEnv
            : (isProduction ? 10 : 3); // Limit to 10 in prod to avoid infinite loops

        const retryBaseDelayMs = Number(process.env.REDIS_RETRY_BASE_DELAY_MS || (isProduction ? 250 : 50));
        const retryMaxDelayMs = Number(process.env.REDIS_RETRY_MAX_DELAY_MS || (isProduction ? 30_000 : 2_000));

        const urlHasUsername = Boolean(parsedUrl?.username);
        const urlHasPassword = Boolean(parsedUrl?.password);

        const usernameOverride = !urlHasUsername ? normalizeRedisUrl(process.env.REDIS_USERNAME) : '';
        const passwordOverride = !urlHasPassword ? normalizeRedisUrl(process.env.REDIS_PASSWORD) : '';

        // Railway internal DNS can resolve to IPv6 and cause intermittent timeouts.
        // Default to IPv4 when on Railway + using railway.internal, unless explicitly overridden.
        const envFamily = parseRedisFamily(process.env.REDIS_FAMILY);
        const host = String(parsedUrl?.hostname || '');
        const family = envFamily ?? (isRailway && /(^|\.)railway\.internal$/i.test(host) ? 4 : undefined);

        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES_PER_REQUEST || 3),
            connectTimeout: isProduction ? 10000 : 5000, // 10s for prod, 5s for dev
            commandTimeout: isProduction ? 5000 : 3000,  // 5s for prod, 3s for dev
            retryStrategy: (times) => {
                // Limit retry attempts to avoid infinite loops on persistent failures
                if (maxConnectAttempts > 0 && times > maxConnectAttempts) {
                    console.warn(`⚠️ Redis connection failed after ${maxConnectAttempts} attempts, disabling cache`);
                    isRedisAvailable = false;
                    return null; // Stop retrying
                }

                const expDelay = Math.round(retryBaseDelayMs * Math.pow(1.7, Math.max(0, times - 1)));
                const delay = Math.min(retryMaxDelayMs, Math.max(50, expDelay));
                if (times <= 3 || times % 5 === 0) {
                    console.log(`🔄 Redis retry ${times}/${maxConnectAttempts || '∞'} in ${delay}ms...`);
                }
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
            enableReadyCheck,
            keepAlive: isProduction ? 30000 : 0, // Keep-alive for production
            ...(family ? { family } : {}),
            ...(useTls ? { tls: { servername: parsedUrl?.hostname } } : {}),
            ...(usernameOverride ? { username: usernameOverride } : {}),
            ...(passwordOverride ? { password: passwordOverride } : {}),
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

async function waitForRedisReady(client, timeoutMs) {
    if (!client) return;
    if (client.status === 'ready') return;

    // If we're in 'wait', attempting connect() is safe and can speed things up.
    if (client.status === 'wait') {
        try {
            await client.connect();
        } catch {
            // We'll fall back to waiting for events below.
        }
        if (client.status === 'ready') return;
    }

    await Promise.race([
        new Promise((resolve, reject) => {
            const onReady = () => cleanup(resolve);
            const onError = (err) => cleanup(() => reject(err));
            const onEnd = () => cleanup(() => reject(new Error('Redis connection ended')));
            const onClose = () => cleanup(() => reject(new Error('Redis connection closed')));

            const cleanup = (done) => {
                client.off('ready', onReady);
                client.off('error', onError);
                client.off('end', onEnd);
                client.off('close', onClose);
                if (typeof done === 'function') done();
            };

            client.once('ready', onReady);
            client.once('error', onError);
            client.once('end', onEnd);
            client.once('close', onClose);
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connect timeout')), timeoutMs)),
    ]);
}

export async function checkRedisHealth(timeoutMs = 5000) {
    const client = initRedis();
    if (!client) return false;

    try {
        // With enableOfflineQueue=false, issuing commands before the socket is ready
        // throws "Stream isn't writeable". Wait for readiness first to avoid false negatives.
        await waitForRedisReady(client, timeoutMs);

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
    const cachedMemory = getMemoryCache(key);
    if (cachedMemory !== null) {
        return cachedMemory;
    }

    const pending = inFlightRequests.get(key);
    if (pending) {
        return await pending;
    }

    const generationAtStart = getGeneration(key);
    const client = initRedis();
    const useRedis = Boolean(client && isRedisAvailable);

    const requestPromise = (async () => {
        try {
            if (useRedis) {
                try {
                    const cached = await client.get(key);
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        setMemoryCache(key, parsed, ttl);
                        return parsed;
                    }
                } catch (err) {
                    console.warn('Cache read error:', err?.message || err);
                }
            }

            const data = await fetcher();

            // Don't cache null/undefined results (avoids caching "not found" responses).
            if (data === null || data === undefined) {
                return data;
            }

            // Avoid caching if the key was invalidated while the fetch was in flight.
            if (getGeneration(key) !== generationAtStart) {
                return data;
            }

            setMemoryCache(key, data, ttl);

            if (useRedis) {
                try {
                    await client.setex(key, ttl, JSON.stringify(data));
                } catch (err) {
                    console.warn('Cache write error:', err?.message || err);
                }
            }

            return data;
        } finally {
            inFlightRequests.delete(key);
        }
    })();

    inFlightRequests.set(key, requestPromise);
    return await requestPromise;
}

/**
 * Set cache value explicitly
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export async function setCache(key, value, ttl = 300) {
    const client = initRedis();

    if (value !== null && value !== undefined) {
        setMemoryCache(key, value, ttl);
    }

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
    if (!keyOrPattern) return;
    invalidateMemoryCache(keyOrPattern);

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
    memoryCache.clear();
    inFlightRequests.clear();
    keyGenerations.clear();

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

    memoryCache.clear();
    inFlightRequests.clear();
    keyGenerations.clear();
}

export default {
    getCached,
    setCache,
    invalidate,
    clearAll,
    isAvailable,
    disconnect,
};
