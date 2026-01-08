import { connectToDatabase, getDb } from './server/lib/db.js';

console.log('🔍 Testing database connection...\n');

try {
    await connectToDatabase();
    const db = getDb();
    const result = await db.query('SELECT 1 as test');

    if (result.rows[0].test === 1) {
        console.log('✅ Database connection SUCCESSFUL!');
        console.log('   DATABASE_URL is working correctly.');
    }

    process.exit(0);
} catch (err) {
    console.error('❌ Database connection FAILED!');
    console.error('   Error:', err.message);
    console.error('\n   DATABASE_URL configured:', !!process.env.DATABASE_URL);
    console.error('   DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    process.exit(1);
}
