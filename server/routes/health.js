import { Router } from 'express';
import { connectToDatabase, getDb } from '../lib/db.js';
import { checkRedisHealth, isAvailable as isRedisAvailable } from '../lib/cache.js';

const router = Router();

// Debug endpoint - REMOVE AFTER TROUBLESHOOTING
router.get('/debug-env', (_req, res) => {
  res.json({
    hasDATA BASE_URL: !!process.env.DATABASE_URL,
    hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
    hasREDIS_URL: !!process.env.REDIS_URL,
    NODE_ENV: process.env.NODE_ENV,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'not_set',
  });
});

router.get('/', async (_req, res) => {
  const rawDatabaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.COCKROACH_DATABASE_URL ||
    process.env.COCKROACHDB_URL ||
    '';
  const trimmedDatabaseUrl = rawDatabaseUrl
    ? String(rawDatabaseUrl)
      .trim()
      .replace(/^["']|["']$/g, '')
    : '';

  const databaseConfig = {
    configured: Boolean(trimmedDatabaseUrl),
    target: undefined,
  };

  try {
    if (trimmedDatabaseUrl) {
      const parsed = new URL(trimmedDatabaseUrl);
      const host = parsed.hostname || 'unknown-host';
      const port = parsed.port || '5432';
      const dbName = (parsed.pathname || '').replace(/^\//, '') || 'unknown-db';
      databaseConfig.target = `${host}:${port}/${dbName}`;
    }
  } catch {
    // ignore parsing errors
  }

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
    databaseConfig,
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
    await connectToDatabase();
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

  // Always return 200 for health checks to allow container orchestration (Railway/K8s)
  // to keep the service alive while it attempts to reconnect to dependencies.
  // The 'status' field in the body will indicate if services are degraded.
  const statusCode = 200;
  res.status(statusCode).json(health);
});

/**
 * Readiness check endpoint
 * Returns 200 only when service is fully ready to accept traffic
 * Use this for Railway healthcheck
 */
router.get('/ready', async (_req, res) => {
  try {
    // Check if database is connected and working
    await connectToDatabase();
    const db = getDb();
    await db.query('SELECT 1');
    
    // Service is ready
    res.status(200).json({ ready: true });
  } catch (err) {
    // Service not ready yet
    res.status(503).json({ 
      ready: false, 
      error: 'Database not ready',
      message: err.message 
    });
  }
});

export default router;
