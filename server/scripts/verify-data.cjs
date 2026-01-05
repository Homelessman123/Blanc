#!/usr/bin/env node

/**
 * Data Consistency Verification Script
 * 
 * Verifies the integrity of data in the database
 * - Orphaned records (no parent)
 * - Missing references (broken foreign keys)
 * - Status inconsistencies
 * - Duplicate entries
 * 
 * Usage: node server/scripts/verify-data.cjs
 */

// NOTE: This script used to be specific to the legacy DB. The project now uses PostgreSQL/CockroachDB.
// Kept for backwards-compat as a simple connectivity check.
require('dotenv').config();

(async () => {
    try {
        const { connectToDatabase, disconnectFromDatabase } = await import('../lib/db.js');
        await connectToDatabase();
        // eslint-disable-next-line no-console
        console.log('✅ Connected to PostgreSQL/CockroachDB');
        await disconnectFromDatabase();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('❌ Verify failed:', err?.message || err);
        process.exitCode = 1;
    }
})();
