/**
 * Promote a user to super_admin (PostgreSQL/CockroachDB via server/lib/db.js)
 *
 * Usage:
 *   node server/scripts/promote-super-admin.js [email]
 *
 * Examples:
 *   node server/scripts/promote-super-admin.js
 *   node server/scripts/promote-super-admin.js dangthhfct31147@gmail.com
 *
 * Requires:
 *   DATABASE_URL env var (PostgreSQL connection string)
 */

import 'dotenv/config';
import { connectToDatabase, getCollection } from '../lib/db.js';

const DEFAULT_EMAIL = 'dangthhfct31147@gmail.com';

function usage(exitCode = 0) {
    // eslint-disable-next-line no-console
    console.log(`\nPromote user to super_admin\n\nUsage:\n  node server/scripts/promote-super-admin.js [email]\n\nDefaults:\n  email = ${DEFAULT_EMAIL}\n`);
    process.exit(exitCode);
}

function normalizeEmail(input) {
    return String(input || '')
        .trim()
        .toLowerCase();
}

async function main() {
    const arg = process.argv.slice(2);
    if (arg.includes('--help') || arg.includes('-h')) usage(0);

    const email = normalizeEmail(arg[0] || DEFAULT_EMAIL);
    if (!email || !email.includes('@')) {
        // eslint-disable-next-line no-console
        console.error('❌ Invalid email:', email);
        usage(1);
    }

    await connectToDatabase();
    const users = getCollection('users');

    const existingUser = await users.findOne({ email });
    if (!existingUser) {
        // eslint-disable-next-line no-console
        console.error(`❌ User not found for email: ${email}`);
        process.exit(1);
    }

    const beforeRole = existingUser.role;

    const updateResult = await users.updateOne(
        { email },
        {
            $set: {
                role: 'super_admin',
                'security.twoFactorEnabled': true,
                'security.twoFactorUpdatedAt': new Date(),
                updatedAt: new Date(),
            },
        }
    );

    const updatedUser = await users.findOne({ email });

    // eslint-disable-next-line no-console
    console.log('✅ Promotion complete');
    // eslint-disable-next-line no-console
    console.log('   - Email:', email);
    // eslint-disable-next-line no-console
    console.log('   - Role:', `${beforeRole || '(unknown)'} -> ${updatedUser?.role || '(unknown)'}`);
    // eslint-disable-next-line no-console
    console.log('   - 2FA Enabled:', updatedUser?.security?.twoFactorEnabled === true);
    // eslint-disable-next-line no-console
    console.log('   - Modified:', updateResult.modifiedCount);
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to promote user:', err?.message || err);
    process.exit(1);
});
