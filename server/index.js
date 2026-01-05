import 'dotenv/config';
import app from './app.js';
import { connectToDatabase, disconnectFromDatabase } from './lib/db.js';
import { disconnect as disconnectCache } from './lib/cache.js';
import { startContestReminderScheduler } from './lib/scheduler.js';
import { validateProductionSetup } from './lib/security.js';
const port = process.env.PORT || 4000;
let server;
let schedulerStarted = false;

// Validate production setup first
if (process.env.NODE_ENV === 'production') {
  const errors = validateProductionSetup();
  if (errors.length > 0) {
    process.exit(1);
  }
}

server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`);
});

async function connectDatabaseWithRetry() {
  const failFast =
    process.env.FAIL_FAST_DB === 'true' ||
    process.env.NODE_ENV === 'production';

  const baseDelayMs = Number(process.env.DB_RETRY_DELAY_MS || 5_000);
  const maxDelayMs = Number(process.env.DB_RETRY_MAX_DELAY_MS || 60_000);
  let delayMs = baseDelayMs;

  // Keep trying in development to avoid crashing the API server when the DB is temporarily unreachable.
  // In production, preserve the previous fail-fast behavior unless overridden.
  while (true) {
    try {
      await connectToDatabase();

      if (!schedulerStarted) {
        startContestReminderScheduler();
        schedulerStarted = true;
      }

      return;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[db] Connection failed:', error?.message || error);

      if (failFast) {
        // eslint-disable-next-line no-console
        console.error('Failed to start API server', error);
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(maxDelayMs, Math.round(delayMs * 1.5));
    }
  }
}

connectDatabaseWithRetry();

// ============================================================================
// GRACEFUL SHUTDOWN HANDLERS
// ============================================================================

async function gracefulShutdown(signal) {
  console.log(`\n⚠️ ${signal} received, closing server gracefully...`);

  // Close HTTP server to stop accepting new requests
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');

      try {
        // Close database connection
        await disconnectFromDatabase();

        // Close Redis connection
        await disconnectCache();

        console.log('✅ All connections closed gracefully');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  }

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('💥 Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});
