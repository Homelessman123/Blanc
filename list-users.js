import 'dotenv/config';
import { connectToDatabase, disconnectFromDatabase, getCollection } from './server/lib/db.js';

async function listUsers() {
    try {
        await connectToDatabase();
        // eslint-disable-next-line no-console
        console.log('Đã kết nối PostgreSQL/CockroachDB\n');

        const users = await getCollection('users')
            .find({}, { projection: { email: 1, name: 1, role: 1, createdAt: 1, _id: 0 } })
            .limit(20)
            .toArray();

        if (users.length === 0) {
            // eslint-disable-next-line no-console
            console.log('❌ Không có user nào trong database!');
        } else {
            // eslint-disable-next-line no-console
            console.log(`📧 Danh sách ${users.length} user trong database:\n`);
            users.forEach((u, i) => {
                // eslint-disable-next-line no-console
                console.log(`${i + 1}. ${u.email}`);
                // eslint-disable-next-line no-console
                console.log(`   Tên: ${u.name || 'N/A'}`);
                // eslint-disable-next-line no-console
                console.log(`   Role: ${u.role || 'N/A'}`);
                // eslint-disable-next-line no-console
                console.log(`   Ngày tạo: ${u.createdAt || 'N/A'}`);
                // eslint-disable-next-line no-console
                console.log('');
            });
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Lỗi:', error?.message || error);
        process.exitCode = 1;
    } finally {
        try {
            await disconnectFromDatabase();
        } catch {
            // ignore
        }
    }
}

listUsers();
