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
let lastRedisError = null;
let lastRedisInitBlockReason = null;

function sanitizeRedisUrl(value) {
    return value ? String(value).trim().replace(/^['"]|['"]$/g, '') : '';
}

function readBoolEnv(name, defaultValue = false) {
    const raw = process.env[name];
    if (raw === undefined) return defaultValue;
    const v = String(raw).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
    return defaultValue;
}

function readIntEnv(name, defaultValue) {
    const raw = process.env[name];
    if (raw === undefined || raw === null || String(raw).trim() === '') return defaultValue;
    const n = Number.parseInt(String(raw), 10);
    return Number.isFinite(n) ? n : defaultValue;
}

function isInternalRedisHost(hostname) {
    if (!hostname) return false;
    const h = String(hostname).toLowerCase();
    return (
        h === 'localhost' ||
        h === '127.0.0.1' ||
        h === '::1' ||
        /(^|\.)railway\.internal$/i.test(h)
    );
}

function getRedisUrlFromEnvWithSource() {
    const candidates = [
        'REDIS_URL',
        'REDIS_PRIVATE_URL',
        'REDIS_PUBLIC_URL',
        'REDIS_URI',
        'REDIS_CONNECTION_STRING',
    ];

    for (const name of candidates) {
        const raw = process.env[name];
        const v = sanitizeRedisUrl(raw);
        if (v) return { url: v, source: name };
    }
    return { url: '', source: null };
}

function looksLikePlaceholder(value) {
    if (!value) return false;
    return (
        value.includes('${{') ||
        value.includes('}}') ||
        (value.includes('<') && value.includes('>'))
    );
}

function getRedisTargetForLogs(redisUrl, tlsEnabled) {
    try {
        const u = new URL(redisUrl);
        const host = u.hostname || 'unknown-host';
        const port = u.port || ((u.protocol === 'rediss:' || tlsEnabled) ? '6380' : '6379');
        const proto = (u.protocol === 'rediss:' || tlsEnabled) ? 'rediss:' : 'redis:';
        return `${proto}//${host}:${port}`;
    } catch {
        return 'invalid-url';
    }
}

export function getRedisEnvSummary() {
    const { url, source } = getRedisUrlFromEnvWithSource();
    const configured = Boolean(url);

    let protocol;
    let host;
    let port;
    let isRailwayInternalHost = false;

    try {
        if (url) {
            const parsed = new URL(url);
            protocol = parsed.protocol;
            host = parsed.hostname;
            port = parsed.port;
            isRailwayInternalHost = parsed.hostname
                ? /(^|\.)railway\.internal$/i.test(parsed.hostname)
                : false;
        }
    } catch {
        // ignore
    }

    return {
        configured,
        source,
        protocol,
        host,
        port,
        isRailwayInternalHost,
        looksLikePlaceholder: looksLikePlaceholder(url),
        targetForLogs: url ? getRedisTargetForLogs(url, protocol === 'rediss:') : undefined,
    };
}

export function getRedisRuntimeSummary() {
    return {
        available: isRedisAvailable,
        hasClient: Boolean(redis),
        lastError: lastRedisError,
        initBlockedReason: lastRedisInitBlockReason,
    };
}

/**
 * Initialize Redis connection
 */
function initRedis() {
    if (redis) return redis;

    const { url: redisUrl, source: redisUrlSource } = getRedisUrlFromEnvWithSource();

    if (!redisUrl) {
        console.warn('⚠️ Redis URL not configured, caching will be disabled');
        lastRedisInitBlockReason = 'redis_url_missing';
        return null;
    }

    if (looksLikePlaceholder(redisUrl)) {
        console.warn(`⚠️ Redis URL looks like a placeholder (${redisUrlSource || 'unknown'}), caching will be disabled until fixed`);
        lastRedisInitBlockReason = 'redis_url_placeholder';
        return null;
    }

    const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
    const isProduction = process.env.NODE_ENV === 'production' || isRailway;

    if (isProduction && /redis:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(redisUrl)) {
        console.warn('⚠️ Redis URL points to localhost in production; caching will fail unless Redis runs in the same container');
    }

    try {
        const family = readIntEnv('REDIS_FAMILY', undefined);
        const connectTimeout = readIntEnv('REDIS_CONNECT_TIMEOUT_MS', isProduction ? 15000 : 5000);
        const commandTimeout = readIntEnv('REDIS_COMMAND_TIMEOUT_MS', isProduction ? 5000 : 3000);
        const enableReadyCheck = readBoolEnv('REDIS_ENABLE_READY_CHECK', true);
        const enableOfflineQueue = readBoolEnv('REDIS_ENABLE_OFFLINE_QUEUE', !isProduction);
        const baseDelay = readIntEnv('REDIS_RETRY_BASE_DELAY_MS', 250);
        const maxDelay = readIntEnv('REDIS_RETRY_MAX_DELAY_MS', 5000);
        const maxConnectAttempts = readIntEnv('REDIS_MAX_CONNECT_ATTEMPTS', isProduction ? 30 : 15);

        let maxRetriesPerRequest = process.env.REDIS_MAX_RETRIES_PER_REQUEST;
        if (maxRetriesPerRequest !== undefined) {
            const v = String(maxRetriesPerRequest).trim().toLowerCase();
            if (v === 'null' || v === 'none' || v === 'disabled') {
                maxRetriesPerRequest = null;
            } else {
                const n = Number.parseInt(v, 10);
                maxRetriesPerRequest = Number.isFinite(n) ? n : (isProduction ? 5 : 3);
            }
        } else {
            maxRetriesPerRequest = isProduction ? 5 : 3;
        }

        let parsed;
        try {
            parsed = new URL(redisUrl);
        } catch {
            parsed = undefined;
        }

        const tlsForced = process.env.REDIS_TLS !== undefined;
        const portSuggestsTls = parsed?.port === '6380';
        const tlsEnabled = tlsForced
            ? readBoolEnv('REDIS_TLS', false)
            : parsed?.protocol === 'rediss:' || portSuggestsTls;
        const tlsRejectUnauthorized = readBoolEnv('REDIS_TLS_REJECT_UNAUTHORIZED', true);

        const requireTlsForced = process.env.REDIS_REQUIRE_TLS_IN_PROD !== undefined;
        const requireTlsInProd = requireTlsForced
            ? readBoolEnv('REDIS_REQUIRE_TLS_IN_PROD', true)
            : true;

        const redisHost = parsed?.hostname;
        const internalHost = isInternalRedisHost(redisHost);

        if (isProduction && requireTlsInProd && !internalHost && !tlsEnabled) {
            console.warn(
                `⚠️ Redis TLS is required in production but disabled (host=${redisHost || 'unknown'}). ` +
                'Set REDIS_URL to rediss://... or set REDIS_TLS=true.'
            );
            lastRedisInitBlockReason = 'tls_required_in_prod';
            return null;
        }

        const options = {
            connectTimeout,
            commandTimeout,
            enableReadyCheck,
            enableOfflineQueue,
            maxRetriesPerRequest,
            autoResubscribe: false,
            autoResendUnfulfilledCommands: false,
            retryStrategy: (times) => {
                if (maxConnectAttempts && times > maxConnectAttempts) return null;
                const delay = Math.min(baseDelay * Math.max(1, times), maxDelay);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                return typeof err?.message === 'string' && err.message.includes(targetError);
            },
        };

        if (family === 4 || family === 6) {
            options.family = family;
        } else if (isRailway) {
            // Railway internal DNS sometimes resolves AAAA first; forcing IPv4 avoids ETIMEDOUT on some deployments.
            options.family = 4;
        }

        if (tlsEnabled) {
            const servername =
                sanitizeRedisUrl(process.env.REDIS_TLS_SERVERNAME) ||
                (redisHost ? String(redisHost) : undefined);
            options.tls = {
                rejectUnauthorized: tlsRejectUnauthorized,
                ...(servername ? { servername } : {}),
            };
        }

        console.log(
            `🔌 Redis connecting to ${getRedisTargetForLogs(redisUrl, tlsEnabled)}${tlsEnabled ? ' (TLS)' : ''}` +
            (redisUrlSource ? ` [${redisUrlSource}]` : '')
        );

        // reset diagnostics on new init
        lastRedisError = null;
        lastRedisInitBlockReason = null;

        redis = new Redis(redisUrl, options);

        redis.on('connect', () => {
            console.log('✅ Redis connected');
            // TCP connected does not mean AUTH/ready yet
            isRedisAvailable = false;
        });

        redis.on('ready', () => {
            console.log('✅ Redis ready');
            isRedisAvailable = true;
        });

        redis.on('error', (err) => {
            const code = err?.code ? ` (${err.code})` : '';
            console.error(`❌ Redis error${code}:`, err?.message || String(err));
            lastRedisError = {
                at: new Date().toISOString(),
                code: err?.code,
                message: err?.message || String(err),
            };
            isRedisAvailable = false;
        });

        redis.on('close', () => {
            console.warn('⚠️ Redis connection closed');
            isRedisAvailable = false;
        });

        redis.on('end', () => {
            console.warn('⚠️ Redis connection ended');
            isRedisAvailable = false;
        });

        redis.on('reconnecting', () => {
            console.warn('🔁 Redis reconnecting...');
            isRedisAvailable = false;
        });

        return redis;
    } catch (err) {
        console.error('Failed to initialize Redis:', err);
        return null;
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
 * Check Redis health by pinging
 */
export async function checkRedisHealth(timeoutMs = 5000) {
    const client = initRedis();
    if (!client) return false;

    try {
        const effectiveTimeoutMs = readIntEnv('REDIS_HEALTHCHECK_TIMEOUT_MS', timeoutMs);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), effectiveTimeoutMs)
        );
        await Promise.race([client.ping(), timeoutPromise]);
        return isRedisAvailable;
    } catch {
        return false;
    }
}

/**
 * Disconnect from Redis
 */
export async function disconnect() {
    if (redis) {
        try {
            await redis.quit();
        } catch {
            // Ignore errors during disconnect
        }
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
    checkRedisHealth,
    disconnect,
};
