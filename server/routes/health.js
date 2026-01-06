import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { checkRedisHealth, isAvailable as isRedisAvailable } from '../lib/cache.js';

const router = Router();

router.get('/', async (_req, res) => {
  const rawRedisUrl = process.env.REDIS_URL || process.env.REDIS_URI || '';
  const sanitizedRedisUrl = rawRedisUrl
    ? String(rawRedisUrl)
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/:\/\/([^@]+)@/i, '://***@')
    : '';

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
    redisConfig: {
      configured: Boolean(rawRedisUrl),
      url: sanitizedRedisUrl || undefined,
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  };

  // Check database connectivity
  try {
    const db = getDb();
    await db.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (err) {
    const msg = String(err?.message || '');
    health.services.database = msg.includes('Database has not been initialized')
      ? 'not_initialized'
      : 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis availability
  try {
    const ok = await checkRedisHealth();
    health.services.redis = ok || isRedisAvailable() ? 'healthy' : 'unavailable';
  } catch (err) {
    health.services.redis = 'error';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
