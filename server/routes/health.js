import { Router } from 'express';
import { connectToDatabase, getDb } from '../lib/db.js';
import { checkRedisHealth, getRedisEnvSummary, getRedisRuntimeSummary, isAvailable as isRedisAvailable } from '../lib/cache.js';
import dns from 'node:dns';
import net from 'node:net';

const router = Router();

function isTruthy(value) {
  if (value === undefined || value === null) return false;
  const v = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(v);
}

async function probeTcp(host, port, timeoutMs) {
  return await new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = new net.Socket();

    const done = (result) => {
      try { socket.destroy(); } catch { /* ignore */ }
      resolve({ ...result, elapsedMs: Date.now() - startedAt });
    };

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => done({ ok: true }));
    socket.once('timeout', () => done({ ok: false, error: 'timeout' }));
    socket.once('error', (err) => done({ ok: false, error: err?.code || err?.message || String(err) }));

    try {
      socket.connect(port, host);
    } catch (err) {
      done({ ok: false, error: err?.message || String(err) });
    }
  });
}

// Debug endpoint - REMOVE AFTER TROUBLESHOOTING
router.get('/debug-env', (_req, res) => {
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
  const isProduction = process.env.NODE_ENV === 'production' || isRailway;

  // Protect debug endpoint in production.
  // Set HEALTH_DEBUG_TOKEN and call with header: x-health-debug-token: <token>
  if (isProduction) {
    const token = process.env.HEALTH_DEBUG_TOKEN;
    const provided = _req.get('x-health-debug-token');
    if (!token || !provided || provided !== token) {
      return res.status(404).json({ error: 'not_found' });
    }
  }

  const redisSummary = getRedisEnvSummary();

  const enableProbes = isTruthy(process.env.HEALTH_DEBUG_PROBES);
  const probeTimeoutMs = Number.parseInt(String(process.env.HEALTH_DEBUG_PROBE_TIMEOUT_MS || '2000'), 10) || 2000;

  const payload = {
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
    hasREDIS_URL: !!process.env.REDIS_URL,
    NODE_ENV: process.env.NODE_ENV,
    railway: {
      isRailway,
      environment: process.env.RAILWAY_ENVIRONMENT,
      projectId: process.env.RAILWAY_PROJECT_ID,
      serviceId: process.env.RAILWAY_SERVICE_ID,
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
      gitCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.RAILWAY_GIT_COMMIT,
    },
    redisDiagnostics: {
      configured: redisSummary.configured,
      source: redisSummary.source,
      protocol: redisSummary.protocol,
      host: redisSummary.host,
      port: redisSummary.port,
      isRailwayInternalHost: redisSummary.isRailwayInternalHost,
      looksLikePlaceholder: redisSummary.looksLikePlaceholder,
      env: {
        REDIS_URL: process.env.REDIS_URL ? 'set' : undefined,
        REDIS_PRIVATE_URL: process.env.REDIS_PRIVATE_URL ? 'set' : undefined,
        REDIS_PUBLIC_URL: process.env.REDIS_PUBLIC_URL ? 'set' : undefined,
        REDIS_URI: process.env.REDIS_URI ? 'set' : undefined,
        REDIS_CONNECTION_STRING: process.env.REDIS_CONNECTION_STRING ? 'set' : undefined,
        REDIS_FAMILY: process.env.REDIS_FAMILY,
        REDIS_TLS: process.env.REDIS_TLS,
        REDIS_REQUIRE_TLS_IN_PROD: process.env.REDIS_REQUIRE_TLS_IN_PROD,
        REDIS_TLS_REJECT_UNAUTHORIZED: process.env.REDIS_TLS_REJECT_UNAUTHORIZED,
        REDIS_TLS_SERVERNAME: process.env.REDIS_TLS_SERVERNAME,
        REDIS_ENABLE_READY_CHECK: process.env.REDIS_ENABLE_READY_CHECK,
        REDIS_ENABLE_OFFLINE_QUEUE: process.env.REDIS_ENABLE_OFFLINE_QUEUE,
        REDIS_COMMAND_TIMEOUT_MS: process.env.REDIS_COMMAND_TIMEOUT_MS,
        REDIS_MAX_CONNECT_ATTEMPTS: process.env.REDIS_MAX_CONNECT_ATTEMPTS,
        REDIS_MAX_RETRIES_PER_REQUEST: process.env.REDIS_MAX_RETRIES_PER_REQUEST,
        REDIS_RETRY_BASE_DELAY_MS: process.env.REDIS_RETRY_BASE_DELAY_MS,
        REDIS_RETRY_MAX_DELAY_MS: process.env.REDIS_RETRY_MAX_DELAY_MS,
        REDIS_HEALTHCHECK_TIMEOUT_MS: process.env.REDIS_HEALTHCHECK_TIMEOUT_MS,
      },
      computedDefaults: {
        isProduction,
        connectTimeoutMs: isProduction ? 10000 : 5000,
        commandTimeoutMs: isProduction ? 5000 : 3000,
        healthcheckDefaultTimeoutMs: isRailway ? 12000 : 5000,
      },
    },
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'not_set',
  };

  // Optional probes: DNS lookup + TCP connect. Useful on Railway when Redis is sleeping or private networking is broken.
  // Enable by setting HEALTH_DEBUG_PROBES=true.
  if (enableProbes && redisSummary.host && redisSummary.port) {
    const port = Number.parseInt(String(redisSummary.port), 10) || 6379;

    Promise.resolve()
      .then(async () => {
        const lookup = await dns.promises.lookup(redisSummary.host, { all: true });
        return lookup.map((x) => ({ address: x.address, family: x.family }));
      })
      .then(async (addresses) => {
        payload.redisDiagnostics.probes = {
          dns: { ok: true, addresses },
        };
        const tcp = await probeTcp(redisSummary.host, port, probeTimeoutMs);
        payload.redisDiagnostics.probes.tcp = tcp;
      })
      .catch((err) => {
        payload.redisDiagnostics.probes = {
          dns: { ok: false, error: err?.code || err?.message || String(err) },
        };
      })
      .finally(() => res.json(payload));

    return;
  }

  res.json(payload);
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

  const redisEnv = getRedisEnvSummary();
  const redisRuntime = getRedisRuntimeSummary();

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
      configured: redisEnv.configured,
      source: redisEnv.source || undefined,
      protocol: redisEnv.protocol,
      host: redisEnv.host,
      port: redisEnv.port,
      isRailwayInternalHost: redisEnv.isRailwayInternalHost,
      looksLikePlaceholder: redisEnv.looksLikePlaceholder,
    },
    redisRuntime,
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

  // If Redis is configured but init is blocked, surface it as misconfigured.
  if (health.redisConfig.configured && health.redisRuntime?.initBlockedReason) {
    health.services.redis = 'misconfigured';
    health.status = 'degraded';
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
 * Use this for Railway healthcheck with detailed diagnostics
 */
router.get('/ready', async (_req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    ready: false,
    checks: {},
    errors: [],
  };

  try {
    // Check 1: Database URL configured (most critical)
    const dbUrl = process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.COCKROACH_DATABASE_URL ||
      process.env.COCKROACHDB_URL ||
      '';

    if (!dbUrl || !dbUrl.trim()) {
      diagnostics.checks.database_url = 'missing';
      diagnostics.errors.push('DATABASE_URL is not set');
      return res.status(503).json({
        ...diagnostics,
        error: 'Database not ready',
        message: 'DATABASE_URL is not set. Check Railway environment variables.',
      });
    }

    // Check for placeholder values
    if (dbUrl.includes('${{') || dbUrl.includes('}}') || dbUrl.includes('<') || dbUrl.includes('>')) {
      diagnostics.checks.database_url = 'placeholder';
      diagnostics.errors.push('DATABASE_URL contains placeholder values');
      return res.status(503).json({
        ...diagnostics,
        error: 'Database not ready',
        message: 'DATABASE_URL has placeholder values that were not replaced',
      });
    }

    diagnostics.checks.database_url = 'configured';

    // Check 2: Database connection
    await connectToDatabase();
    const db = getDb();
    await db.query('SELECT 1');
    diagnostics.checks.database_connection = 'healthy';

    // Check 3: Critical collections (verify schema)
    const collections = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);
    diagnostics.checks.database_schema = collections.rows.length > 0 ? 'ready' : 'empty';

    // Check 4: Redis (optional - warning only)
    if (process.env.REDIS_URL) {
      try {
        const redisHealthy = await checkRedisHealth();
        diagnostics.checks.redis = redisHealthy || isRedisAvailable() ? 'healthy' : 'unavailable';
      } catch (err) {
        diagnostics.checks.redis = 'error';
        diagnostics.errors.push(`Redis: ${err.message}`);
      }
    } else {
      diagnostics.checks.redis = 'not_configured';
    }

    // All critical checks passed
    diagnostics.ready = true;
    return res.status(200).json(diagnostics);

  } catch (err) {
    diagnostics.checks.database_connection = 'failed';
    diagnostics.errors.push(`Database connection: ${err.message}`);

    return res.status(503).json({
      ...diagnostics,
      error: 'Database not ready',
      message: err.message || 'Database connection failed',
    });
  }
});

export default router;
