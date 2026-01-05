import 'dotenv/config';
import { connectToDatabase, getDb } from '../lib/db.js';

async function main() {
    await connectToDatabase();
    const pool = getDb();

    // A simple JSON-document store on top of CockroachDB/PostgreSQL.
    // Keeps existing document-style routes working while removing the legacy runtime.
    const statements = [
        `CREATE TABLE IF NOT EXISTS documents (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      doc JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (collection, id)
    )`,
        `CREATE INDEX IF NOT EXISTS documents_collection_idx ON documents (collection)`,
        // CockroachDB supports inverted indexes for JSONB. This is best-effort.
        `CREATE INVERTED INDEX IF NOT EXISTS documents_doc_inverted_idx ON documents (doc)`,

        `CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            owner_id TEXT,
            folder TEXT NOT NULL,
            file_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size_bytes BIGINT NOT NULL,
            sha256 TEXT NOT NULL,
            is_public BOOL NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            content BYTEA NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS media_owner_idx ON media (owner_id)`,
        `CREATE INDEX IF NOT EXISTS media_public_created_idx ON media (is_public, created_at DESC)`,
    ];

    for (const statement of statements) {
        try {
            await pool.query(statement);
            // eslint-disable-next-line no-console
            console.log('✅', statement.split('\n')[0].trim());
        } catch (err) {
            // Some Postgres variants may not support INVERTED INDEX; continue.
            // eslint-disable-next-line no-console
            console.warn('⚠️ Skipped statement:', statement.split('\n')[0].trim());
            // eslint-disable-next-line no-console
            console.warn('   ', err?.message || err);
        }
    }

    await pool.end();
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to initialize DB:', err);
    process.exitCode = 1;
});
