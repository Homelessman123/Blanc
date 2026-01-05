/**
 * Contest Reminder Scheduler
 * Tự động gửi email nhắc nhở 24h và 1h trước khi cuộc thi bắt đầu
 */

import { ObjectId } from './objectId.js';
import crypto from 'crypto';
import { connectToDatabase, getCollection } from '../lib/db.js';

const NOTIFICATION_URL = process.env.NOTIFICATION_EMAIL_URL;
const SECRET_KEY = process.env.OTP_SECRET_KEY;

// Khoảng thời gian kiểm tra (mỗi 30 phút)
const CHECK_INTERVAL = 30 * 60 * 1000;

// Flag để tránh chạy đồng thời
let isRunning = false;

/**
 * Generate HMAC signature
 * @param {string} action - The notification action type
 * @param {string} [email] - Optional email to include in signature
 */
function generateSignature(action, email = null) {
    const timestamp = Date.now();
    const nonce = crypto.randomUUID();

    // Build canonical string - MUST match App Script's verification order:
    // action, nonce, timestamp, [email]
    let canonicalString = `action=${action}&nonce=${nonce}&timestamp=${timestamp}`;
    if (email) {
        canonicalString += `&email=${email}`;
    }

    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(canonicalString)
        .digest('base64');
    return { timestamp, nonce, signature };
}

/**
 * Gửi notification qua App Script
 */
async function sendNotification(payload) {
    if (!NOTIFICATION_URL) {
        console.warn('[scheduler] NOTIFICATION_EMAIL_URL not configured');
        return null;
    }

    // Include email in signature for email-bound verification
    const sigData = generateSignature(payload.action, payload.email || null);

    try {
        const response = await fetch(NOTIFICATION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, ...sigData })
        });

        return await response.json();
    } catch (err) {
        console.error('[scheduler] Failed to send notification:', err.message);
        return null;
    }
}

/**
 * Format date to Vietnamese
 */
function formatDate(date) {
    return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Kiểm tra và gửi nhắc nhở cho các cuộc thi sắp diễn ra
 */
async function checkAndSendReminders() {
    if (isRunning) {
        console.log('[scheduler] Previous check still running, skipping...');
        return;
    }

    isRunning = true;

    try {
        await connectToDatabase();

        const now = new Date();
        const contests = getCollection('contests');
        const registrations = getCollection('registrations');
        const users = getCollection('users');
        const sentReminders = getCollection('sent_reminders');

        // Tìm contests trong 24h tới
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);

        // Tìm contests trong 1h tới
        const in1h = new Date(now.getTime() + 60 * 60 * 1000);
        const in30min = new Date(now.getTime() + 30 * 60 * 1000);

        // Lấy contests cần nhắc nhở 24h
        const contests24h = await contests.find({
            dateStart: { $gte: in23h, $lte: in24h },
            status: { $in: ['upcoming', 'published', 'active'] }
        }).toArray();

        // Lấy contests cần nhắc nhở 1h
        const contests1h = await contests.find({
            dateStart: { $gte: in30min, $lte: in1h },
            status: { $in: ['upcoming', 'published', 'active'] }
        }).toArray();

        console.log(`[scheduler] Found ${contests24h.length} contests for 24h reminder, ${contests1h.length} for 1h reminder`);

        // Gửi nhắc nhở 24h
        for (const contest of contests24h) {
            await sendContestReminders(contest, '24h', registrations, users, sentReminders);
        }

        // Gửi nhắc nhở 1h
        for (const contest of contests1h) {
            await sendContestReminders(contest, '1h', registrations, users, sentReminders);
        }

    } catch (error) {
        console.error('[scheduler] Error checking reminders:', error);
    } finally {
        isRunning = false;
    }
}

/**
 * Gửi nhắc nhở cho một cuộc thi
 */
async function sendContestReminders(contest, reminderType, registrations, users, sentReminders) {
    const contestId = contest._id.toString();

    // Lấy danh sách đăng ký
    const regs = await registrations.find({ contestId }).toArray();

    if (regs.length === 0) {
        console.log(`[scheduler] No registrations for contest ${contest.title}`);
        return;
    }

    const userIds = regs.map(r => new ObjectId(r.userId));

    // Lấy users với preferences
    const usersData = await users.find(
        { _id: { $in: userIds } },
        { projection: { email: 1, name: 1, notifications: 1 } }
    ).toArray();

    // Filter users muốn nhận thông báo
    const eligibleUsers = usersData.filter(u => {
        const notifs = u.notifications || {};
        return notifs.contestReminders !== false && notifs.email !== false;
    });

    console.log(`[scheduler] Sending ${reminderType} reminder for "${contest.title}" to ${eligibleUsers.length} users`);

    const contestDate = new Date(contest.dateStart);
    const frontendUrl = process.env.FRONTEND_ORIGIN?.split(',')[0] || 'http://localhost:5173';

    let sent = 0;
    let skipped = 0;

    for (const user of eligibleUsers) {
        // Kiểm tra đã gửi chưa
        const reminderKey = `${contestId}_${user._id.toString()}_${reminderType}`;
        const alreadySent = await sentReminders.findOne({ key: reminderKey });

        if (alreadySent) {
            skipped++;
            continue;
        }

        // Gửi notification
        const result = await sendNotification({
            action: 'contestReminder',
            email: user.email,
            userName: user.name || 'bạn',
            contestTitle: contest.title,
            contestDate: formatDate(contestDate),
            contestTime: formatTime(contestDate),
            contestUrl: `${frontendUrl}/#/contests/${contestId}`,
            reminderType
        });

        if (result?.ok) {
            // Đánh dấu đã gửi
            await sentReminders.insertOne({
                key: reminderKey,
                contestId,
                userId: user._id.toString(),
                reminderType,
                sentAt: new Date()
            });
            sent++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`[scheduler] ${reminderType} reminder for "${contest.title}": sent=${sent}, skipped=${skipped}`);
}

/**
 * Khởi động scheduler
 */
export function startContestReminderScheduler() {
    if (!NOTIFICATION_URL) {
        console.warn('[scheduler] NOTIFICATION_EMAIL_URL not configured, scheduler disabled');
        return null;
    }

    console.log('[scheduler] Starting contest reminder scheduler...');

    // Chạy ngay lần đầu sau 5 giây
    setTimeout(checkAndSendReminders, 5000);

    // Lặp lại mỗi 30 phút
    const intervalId = setInterval(checkAndSendReminders, CHECK_INTERVAL);

    return intervalId;
}

/**
 * Dừng scheduler
 */
export function stopContestReminderScheduler(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
        console.log('[scheduler] Contest reminder scheduler stopped');
    }
}

// Export để có thể test
export { checkAndSendReminders };
