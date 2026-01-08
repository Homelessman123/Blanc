import { Router } from 'express';
import { connectToDatabase, getDb } from '../lib/db.js';
import { checkRedisHealth, isAvailable as isRedisAvailable } from '../lib/cache.js';

const router = Router();

// Debug endpoint - REMOVE AFTER TROUBLESHOOTING
router.get('/debug-env', (_req, res) => {
  res.json({
    hasDATABASE_URL: !!process.env.DATABASE_URL,
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
  const diagnostics = {
    timestamp: new Date().toISOString(),
    ready: false,
    checks: {},
  };

  try {
    // Check 1: Database URL configured
    const dbUrl = process.env.DATABASE_URL || 
                  process.env.POSTGRES_URL || 
                  process.env.COCKROACH_DATABASE_URL;
    
    if (!dbUrl || dbUrl.trim() === '') {
      diagnostics.checks.database_url = 'MISSING';
      diagnostics.error = 'DATABASE_URL not configured in Railway variables';
      return res.status(503).json(diagnostics);
    }
    
    // Check for placeholder that wasn't replaced
    if (dbUrl.includes('${{') || dbUrl.includes('}}')) {
      diagnostics.checks.database_url = 'PLACEHOLDER_NOT_REPLACED';
      diagnostics.error = 'Railway plugin variable not expanded';
      diagnostics.debug = { prefix: dbUrl.substring(0, 50) };
      return res.status(503).json(diagnostics);
    }
    
    diagnostics.checks.database_url = 'configured';

    // Check 2: Database connection
    await connectToDatabase();
    const db = getDb();
    const result = await db.query('SELECT 1 as test');
    
    if (result.rows && result.rows[0]?.test === 1) {
      diagnostics.checks.database_connection = 'healthy';
    } else {
      diagnostics.checks.database_connection = 'unhealthy';
      return res.status(503).json(diagnostics);
    }

    // All checks passed
    diagnostics.ready = true;
    res.status(200).json(diagnostics);

  } catch (err) {
    diagnostics.checks.error = err.message;
    diagnostics.error = `Service not ready: ${err.message}`;
    diagnostics.ready = false;
    res.status(503).json(diagnostics);
  }
});

export default router;
