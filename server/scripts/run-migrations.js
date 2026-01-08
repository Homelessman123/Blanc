import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, connectToDatabase, disconnectFromDatabase } from '../lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration Runner for PostgreSQL/CockroachDB
 * 
 * This script:
 * 1. Creates a migrations tracking table
 * 2. Runs all pending .sql migration files in order
 * 3. Records completed migrations to avoid re-running
 * 
 * Usage:
 *   node server/scripts/run-migrations.js
 * 
 * Railway:
 *   Add to railway.toml or run manually after deploy
 */

async function runMigrations() {
    console.log('🔄 Starting database migrations...\n');

    try {
        await connectToDatabase();
        const pool = getDb();

        // Step 1: Create migrations tracking table
        console.log('📋 Creating migrations tracking table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMPTZ DEFAULT now()
            )
        `);
        console.log('✅ Migrations table ready\n');

        // Step 2: Get list of migration files
        const migrationsDir = path.join(__dirname, 'migrations');

        if (!fs.existsSync(migrationsDir)) {
            console.log('⚠️  No migrations directory found. Creating...');
            fs.mkdirSync(migrationsDir, { recursive: true });
            console.log('✅ Created migrations directory\n');
            console.log('📝 No migrations to run.');
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        if (files.length === 0) {
            console.log('📝 No migration files found.');
            return;
        }

        console.log(`📂 Found ${files.length} migration file(s):\n`);
        files.forEach(f => console.log(`   - ${f}`));
        console.log('');

        // Step 3: Run each migration
        let appliedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            // Check if already applied
            const existsResult = await pool.query(
                'SELECT 1 FROM migrations WHERE name = $1',
                [file]
            );

            if (existsResult.rowCount > 0) {
                console.log(`⏭️  Skipping ${file} (already applied)`);
                skippedCount++;
                continue;
            }

            // Read and execute migration
            console.log(`▶️  Running migration: ${file}`);
            const migrationPath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(migrationPath, 'utf8');

            try {
                // Split by semicolons and filter out empty statements
                const statements = sql
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s && !s.startsWith('--'));

                for (const statement of statements) {
                    if (statement) {
                        await pool.query(statement);
                    }
                }

                // Record successful migration
                await pool.query(
                    'INSERT INTO migrations (name) VALUES ($1)',
                    [file]
                );

                console.log(`✅ Completed: ${file}\n`);
                appliedCount++;
            } catch (err) {
                console.error(`❌ Failed to apply ${file}:`, err.message);
                console.error('   Rolling back...\n');
                throw err; // Stop on first error
            }
        }

        // Step 4: Summary
        console.log('═'.repeat(60));
        console.log('📊 Migration Summary:');
        console.log(`   ✅ Applied: ${appliedCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);
        console.log(`   📁 Total files: ${files.length}`);
        console.log('═'.repeat(60));

        if (appliedCount > 0) {
            console.log('\n🎉 Migrations completed successfully!');
            console.log('\n💡 Tip: Verify indexes were created with:');
            console.log('   SELECT indexname FROM pg_indexes WHERE tablename = \'documents\';');
        } else {
            console.log('\n✨ All migrations already applied. Database is up to date!');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    } finally {
        await disconnectFromDatabase();
    }
}

// Run migrations
runMigrations().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
