import { Request, Response } from 'express';
import prisma from '../db';
import { getUserRegistrations, getUserCalendarEvents, getUserStreak } from '../services/googleAppsScript.service';
import { getTeammateRecommendations } from '../services/teammateRecommendation.service';

/**
 * Get user's registered contests (from DB)
 */
export const getMyRegistrations = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const registrations = await getUserRegistrations(userId);

        res.json({
            success: true,
            registrations,
        });
    } catch (error: any) {
        console.error('Error fetching user registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations',
        });
    }
};

/**
 * Get user's calendar events (from DB)
 */
export const getMyCalendarEvents = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const events = await getUserCalendarEvents(userId, start, end);

        res.json({
            success: true,
            events,
        });
    } catch (error: any) {
        console.error('Error fetching user calendar events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch calendar events',
        });
    }
};

/**
 * Create a custom calendar event for the current user
 */
export const createCalendarEvent = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { title, description, startDate, endDate, type } = req.body;

        if (!title || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'title, startDate, endDate là bắt buộc' });
        }

        const event = await prisma.calendarEvent.create({
            data: {
                userId,
                title,
                description: description ?? '',
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                type: type || 'PERSONAL',
            },
        });

        res.json({ success: true, event });
    } catch (error) {
        console.error('Create calendar event error:', error);
        res.status(500).json({ success: false, message: 'Không thể tạo sự kiện' });
    }
};

/**
 * Get user's streak data (from DB)
 */
export const getMyStreak = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const streakData = await getUserStreak(userId);

        res.json({
            success: true,
            streak: streakData,
        });
    } catch (error: any) {
        console.error('Error fetching user streak:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch streak data',
        });
    }
};

/**
 * Search users by name/email (partial, case-insensitive)
 */
export const searchUsers = async (req: Request, res: Response) => {
    try {
        const query = (req.query.query as string | undefined)?.trim();

        if (!query || query.length < 2) {
            return res.json({ success: true, users: [] });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { displayName: { contains: query } },
                    { email: { contains: query } },
                ],
            },
            select: {
                id: true,
                name: true,
                displayName: true,
                email: true,
                phoneNumber: true,
                profileColor: true,
            },
            take: 15,
            orderBy: [
                { displayName: 'asc' },
                { name: 'asc' },
            ],
        });

        res.json({ success: true, users });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, message: 'Không thể tìm kiếm người dùng' });
    }
};

/**
 * Teammate recommendations based on profile complementarity
 */
export const getTeammateRecommendationsController = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const recommendations = await getTeammateRecommendations(userId);

        res.json({
            success: true,
            recommendations,
        });
    } catch (error: any) {
        console.error('Get teammate recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách gợi ý đồng đội',
        });
    }
};
