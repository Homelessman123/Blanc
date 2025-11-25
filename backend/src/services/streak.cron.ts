import cron from 'node-cron';
import prisma from '../db';

/**
 * Reset streak về 0 cho những user không đăng nhập hôm qua
 * Chạy hàng ngày lúc 00:05 (5 phút sau nửa đêm để đảm bảo ngày mới đã bắt đầu)
 */
export const resetMissedStreaks = async () => {
    try {
        const now = new Date();

        // Tính ngày hôm qua (00:00:00)
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        // Tính ngày hôm nay (00:00:00)
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Tìm những user có streak > 0 và lastLoginDate < today
        // (tức là không đăng nhập trong ngày hôm qua hoặc trước đó)
        const usersToReset = await prisma.user.findMany({
            where: {
                streak: { gt: 0 },
                OR: [
                    { lastLoginDate: null },
                    { lastLoginDate: { lt: yesterday } }
                ]
            },
            select: {
                id: true,
                email: true,
                name: true,
                streak: true,
                lastLoginDate: true
            }
        });

        if (usersToReset.length > 0) {
            console.log(`[Streak Cron] Found ${usersToReset.length} users to reset streak`);

            // Reset streak về 0 cho những user này
            const resetResult = await prisma.user.updateMany({
                where: {
                    id: { in: usersToReset.map(u => u.id) }
                },
                data: {
                    streak: 0
                }
            });

            console.log(`[Streak Cron] Reset ${resetResult.count} users' streaks to 0`);

            // Log chi tiết những user bị reset (optional, có thể bỏ nếu quá nhiều)
            for (const user of usersToReset) {
                console.log(`[Streak Cron] Reset streak for ${user.email}: ${user.streak} -> 0`);

                // Tạo StreakLog để ghi nhận việc reset
                await prisma.streakLog.create({
                    data: {
                        userId: user.id,
                        email: user.email,
                        date: now,
                        streakCount: 0,
                        action: 'STREAK_RESET_AUTO'
                    }
                });
            }
        } else {
            console.log('[Streak Cron] No users need streak reset');
        }

        return {
            success: true,
            resetCount: usersToReset.length
        };
    } catch (error) {
        console.error('[Streak Cron] Error resetting streaks:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

/**
 * Khởi động cron job để reset streak hàng ngày
 * Chạy lúc 00:05 mỗi ngày (theo timezone của server)
 */
export const startStreakCronJob = () => {
    // Cron expression: '5 0 * * *' = 00:05 mỗi ngày
    const job = cron.schedule('5 0 * * *', async () => {
        console.log('[Streak Cron] Running daily streak reset job...');
        const result = await resetMissedStreaks();
        console.log('[Streak Cron] Job completed:', result);
    }, {
        timezone: 'Asia/Ho_Chi_Minh' // Timezone Việt Nam
    });

    console.log('[Streak Cron] Daily streak reset job scheduled for 00:05 (Asia/Ho_Chi_Minh)');

    return job;
};

/**
 * API endpoint để trigger reset thủ công (dành cho admin/testing)
 */
export const manualResetMissedStreaks = async () => {
    console.log('[Streak Cron] Manual streak reset triggered');
    return resetMissedStreaks();
};
