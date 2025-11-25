import { Request, Response } from 'express';
import prisma from '../db';

/**
 * Sync Controller - API endpoints for Google Apps Script integration
 * Handles bidirectional sync between ContestHub backend and Google Sheets
 */

// ==================== USER STREAK SYNC ====================

/**
 * POST /api/sync/user-streak
 * Update user streak data (called from Apps Script or frontend after login)
 */
export const updateUserStreak = async (req: Request, res: Response) => {
    try {
        const { userId, email, name, displayName, streakCount } = req.body;

        if (!userId && !email) {
            return res.status(400).json({ error: 'userId or email is required' });
        }

        // Find user by userId or email
        const user = await prisma.user.findFirst({
            where: userId ? { id: userId } : { email: email },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user streak
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                streak: streakCount !== undefined ? streakCount : user.streak,
                lastLoginDate: new Date(),
                ...(name && { name }),
                ...(displayName && { displayName }),
            },
        });

        return res.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                displayName: updatedUser.displayName,
                streak: updatedUser.streak,
                lastLoginDate: updatedUser.lastLoginDate,
            },
        });
    } catch (error) {
        console.error('Error updating user streak:', error);
        return res.status(500).json({ error: 'Failed to update user streak' });
    }
};

/**
 * GET /api/sync/users/streak
 * Get all users with their streak data (for Apps Script to sync)
 */
export const getUsersStreak = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                displayName: true,
                streak: true,
                lastLoginDate: true,
                createdAt: true,
                emailNotifications: true,
                contestReminders: true,
            },
        });

        return res.json({
            success: true,
            count: users.length,
            users: users,
        });
    } catch (error) {
        console.error('Error fetching users streak:', error);
        return res.status(500).json({ error: 'Failed to fetch users streak' });
    }
};

// ==================== CONTEST REGISTRATION SYNC ====================

/**
 * POST /api/sync/contest-registration
 * Notify Apps Script when user registers for a contest
 */
export const syncContestRegistration = async (req: Request, res: Response) => {
    try {
        const { userId, contestId, eventType } = req.body;

        if (!userId || !contestId) {
            return res.status(400).json({ error: 'userId and contestId are required' });
        }

        // Get user and contest info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, displayName: true },
        });

        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
            select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                registrationDeadline: true,
                organizer: true,
                category: true,
            },
        });

        if (!user || !contest) {
            return res.status(404).json({ error: 'User or Contest not found' });
        }

        // Return data for Apps Script to create calendar event
        return res.json({
            success: true,
            registration: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name || user.displayName || user.email,
                },
                contest: {
                    id: contest.id,
                    title: contest.title,
                    description: contest.description,
                    startDate: contest.startDate,
                    endDate: contest.endDate,
                    registrationDeadline: contest.registrationDeadline,
                    organizer: contest.organizer,
                    category: contest.category,
                },
                eventType: eventType || 'CONTEST',
            },
        });
    } catch (error) {
        console.error('Error syncing contest registration:', error);
        return res.status(500).json({ error: 'Failed to sync contest registration' });
    }
};

/**
 * GET /api/sync/contests
 * Get all active contests (for Apps Script to check reminders)
 */
export const getActiveContests = async (req: Request, res: Response) => {
    try {
        const contests = await prisma.contest.findMany({
            where: {
                isActive: true,
                startDate: {
                    gte: new Date(), // Future contests only
                },
            },
            select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                registrationDeadline: true,
                organizer: true,
                category: true,
                participants: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                displayName: true,
                                contestReminders: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                startDate: 'asc',
            },
        });

        // Format data for Apps Script
        const formattedContests = contests.map((contest) => ({
            id: contest.id,
            title: contest.title,
            description: contest.description,
            startDate: contest.startDate,
            endDate: contest.endDate,
            registrationDeadline: contest.registrationDeadline,
            organizer: contest.organizer,
            category: contest.category,
            participants: contest.participants
                .filter((p) => p.user.contestReminders) // Only users who want reminders
                .map((p) => ({
                    id: p.user.id,
                    email: p.user.email,
                    name: p.user.name || p.user.displayName || p.user.email,
                })),
        }));

        return res.json({
            success: true,
            count: formattedContests.length,
            contests: formattedContests,
        });
    } catch (error) {
        console.error('Error fetching active contests:', error);
        return res.status(500).json({ error: 'Failed to fetch active contests' });
    }
};

// ==================== HEALTH CHECK ====================

/**
 * GET /api/sync/health
 * Check if sync API is working
 */
export const healthCheck = async (req: Request, res: Response) => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        return res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                api: 'running',
            },
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: 'Database connection failed',
        });
    }
};
