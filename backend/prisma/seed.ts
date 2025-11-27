import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('Haidang@12', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@contesthub.com' },
        update: {
            password: hashedAdminPassword,
            role: 'ADMIN',
        },
        create: {
            email: 'admin@contesthub.com',
            name: 'ContestHub Admin',
            password: hashedAdminPassword,
            role: 'ADMIN',
            displayName: 'Admin',
            profileColor: '#dc2626',
            phoneNumber: '0900000000',
            balance: 0,
        },
    });

    // Create demo users
    const hashedUserPassword = await bcrypt.hash('password', 10);
    const user1 = await prisma.user.upsert({
        where: { email: 'user@test.com' },
        update: {},
        create: {
            email: 'user@test.com',
            name: 'Nguyễn Văn A',
            password: hashedUserPassword,
            role: 'USER',
            displayName: 'Văn A',
            profileColor: '#3b82f6',
            phoneNumber: '0912345678',
            balance: 100000,
            streak: 5,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'teacher@test.com' },
        update: {},
        create: {
            email: 'teacher@test.com',
            name: 'Trần Thị B',
            password: hashedUserPassword,
            role: 'USER',
            displayName: 'Cô B',
            profileColor: '#10b981',
            phoneNumber: '0987654321',
            balance: 500000,
            streak: 12,
        },
    });

    // Create sample contests
    const now = new Date();
    const contest1 = await prisma.contest.create({
        data: {
            title: 'Cuộc thi Lập trình Olympic 2025',
            description: 'Cuộc thi lập trình dành cho học sinh THPT toàn quốc. Các thí sinh sẽ giải quyết các bài toán thuật toán trong thời gian quy định.',
            startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            registrationDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            organizer: 'Bộ Giáo dục và Đào tạo',
            website: 'https://olympic.edu.vn',
            imageUrl: '/images/National_Science_Engineering_Fair.jpeg',
            category: 'Công nghệ thông tin',
            tags: JSON.stringify(['lập trình', 'thuật toán', 'olympic', 'THPT']),
            maxParticipants: 1000,
            prize: 'Giải nhất: 50 triệu VNĐ, Giải nhì: 30 triệu VNĐ, Giải ba: 20 triệu VNĐ',
            requirements: 'Học sinh THPT, có kiến thức cơ bản về lập trình',
            authorId: admin.id,
            fee: 0, // Miễn phí
            format: 'ONLINE',
            targetGrade: 'THPT (10-12)',
            registrationUrl: 'https://olympic.edu.vn/register',
        },
    });

    const contest2 = await prisma.contest.create({
        data: {
            title: 'IELTS Challenge 2025',
            description: 'Cuộc thi tiếng Anh IELTS dành cho học sinh, sinh viên. Thử thách bản thân với các đề thi thực tế.',
            startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
            registrationDeadline: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
            organizer: 'British Council Vietnam',
            website: 'https://ielts.org',
            imageUrl: '/images/International_SAT_Challenge.webp',
            category: 'Ngoại ngữ',
            tags: JSON.stringify(['IELTS', 'tiếng Anh', 'du học', 'chứng chỉ']),
            maxParticipants: 500,
            prize: 'Giải nhất: Khóa học IELTS miễn phí, Giải nhì: Voucher thi IELTS',
            requirements: 'Không yêu cầu trình độ đầu vào',
            authorId: admin.id,
            fee: 20, // $20
            format: 'HYBRID',
            targetGrade: 'THCS, THPT',
            registrationUrl: 'https://ielts.org/register',
        },
    });

    // Create sample products
    const product1 = await prisma.product.create({
        data: {
            name: 'Khóa học Lập trình C++ cho Olympic',
            description: 'Khóa học chuyên sâu về lập trình C++ dành cho các cuộc thi Olympic Tin học. Bao gồm thuật toán, cấu trúc dữ liệu và các kỹ thuật tối ưu.',
            price: 899000,
            type: 'COURSE',
            imageUrl: '/images/Intro_to_Python_for_Data_Science.jpg',
            isApproved: true,
            categories: JSON.stringify(['Lập trình', 'Olympic Tin học', 'C++']),
            rating: 4.8,
            reviewCount: 156,
            duration: '12 tuần',
            level: 'INTERMEDIATE',
            language: 'Vietnamese',
            sellerId: user2.id,
        },
    });

    const product2 = await prisma.product.create({
        data: {
            name: 'Tài liệu IELTS Speaking Band 8+',
            description: 'Bộ tài liệu hoàn chỉnh cho phần thi IELTS Speaking, bao gồm các chủ đề thường gặp, mẫu câu trả lời và tips từ giám khảo.',
            price: 299000,
            type: 'DOCUMENT',
            imageUrl: '/images/Ultimate_SAT_Math_Prep_Guide.webp',
            isApproved: true,
            categories: JSON.stringify(['Ngoại ngữ', 'IELTS', 'Speaking']),
            rating: 4.5,
            reviewCount: 89,
            duration: '6 tuần ôn tập',
            level: 'ADVANCED',
            language: 'Vietnamese',
            sellerId: user2.id,
        },
    });

    // Link products to contests (MongoDB uses suggestedProductIds array)
    await prisma.contest.update({
        where: { id: contest1.id },
        data: {
            suggestedProductIds: [product1.id]
        }
    });

    await prisma.contest.update({
        where: { id: contest2.id },
        data: {
            suggestedProductIds: [product2.id]
        }
    });

    await prisma.calendarEvent.create({
        data: {
            title: 'Deadline đăng ký Olympic Lập trình',
            description: 'Hạn cuối đăng ký cuộc thi Olympic Lập trình 2025',
            startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
            endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
            type: 'CONTEST_DEADLINE',
            userId: user1.id,
            contestId: contest1.id,
        },
    });

    console.log('✅ Database seeded successfully!');
    console.log('📊 Created:');
    console.log('? Database seeded successfully!');
    console.log('?? Created:');
    console.log('  - 3 users (1 admin, 2 regular users)');
    console.log('  - 2 contests');
    console.log('  - 2 products');
    console.log('  - 1 calendar event');
    console.log('\n?? Login credentials:');
    console.log('  Admin: admin@contesthub.com / Haidang@12');
    console.log('  User: user@test.com / password');
    console.log('  Teacher: teacher@test.com / password');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

