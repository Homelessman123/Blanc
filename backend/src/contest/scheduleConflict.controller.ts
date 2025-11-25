import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScheduleConflict {
    type: 'CONFLICT' | 'REST_PERIOD';
    message: string;
    conflictingContest?: {
        id: string;
        title: string;
        startDate: Date;
        endDate: Date;
    };
}

// Check schedule conflicts for a user registering to a contest
export const checkScheduleConflicts = async (req: Request, res: Response) => {
    try {
        const { contestId, userId } = req.body;

        if (!contestId || !userId) {
            return res.status(400).json({
                message: 'Missing contestId or userId'
            });
        }

        // Get the contest user wants to register for
        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
            select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
            },
        });

        if (!contest) {
            return res.status(404).json({
                message: 'Contest not found'
            });
        }

        // Get all contests the user has registered for
        const userRegistrations = await prisma.contestParticipation.findMany({
            where: {
                userId,
                status: {
                    not: 'CANCELLED',
                },
            },
            include: {
                contest: {
                    select: {
                        id: true,
                        title: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        });

        const conflicts: ScheduleConflict[] = [];

        for (const registration of userRegistrations) {
            const registeredContest = registration.contest;

            // Check for exact date overlap (CONFLICT)
            const contestStart = new Date(contest.startDate);
            const contestEnd = new Date(contest.endDate);
            const registeredStart = new Date(registeredContest.startDate);
            const registeredEnd = new Date(registeredContest.endDate);

            // Check if dates overlap
            if (
                (contestStart >= registeredStart && contestStart <= registeredEnd) ||
                (contestEnd >= registeredStart && contestEnd <= registeredEnd) ||
                (registeredStart >= contestStart && registeredStart <= contestEnd) ||
                (registeredEnd >= contestStart && registeredEnd <= contestEnd)
            ) {
                conflicts.push({
                    type: 'CONFLICT',
                    message: `Trùng lịch với cuộc thi "${registeredContest.title}"`,
                    conflictingContest: registeredContest,
                });
                continue; // Skip rest period check if there's a conflict
            }

            // Check for rest period (within 7 days before or after)
            const daysBefore = Math.floor((contestStart.getTime() - registeredEnd.getTime()) / (1000 * 60 * 60 * 24));
            const daysAfter = Math.floor((registeredStart.getTime() - contestEnd.getTime()) / (1000 * 60 * 60 * 24));

            if (daysBefore >= 0 && daysBefore <= 7) {
                conflicts.push({
                    type: 'REST_PERIOD',
                    message: `Cuộc thi này diễn ra ${daysBefore} ngày sau cuộc thi "${registeredContest.title}". Bạn cần thời gian nghỉ ngơi!`,
                    conflictingContest: registeredContest,
                });
            } else if (daysAfter >= 0 && daysAfter <= 7) {
                conflicts.push({
                    type: 'REST_PERIOD',
                    message: `Cuộc thi này diễn ra ${daysAfter} ngày trước cuộc thi "${registeredContest.title}". Bạn cần thời gian nghỉ ngơi!`,
                    conflictingContest: registeredContest,
                });
            }
        }

        return res.json({
            hasConflicts: conflicts.length > 0,
            conflicts,
        });

    } catch (error: any) {
        console.error('Check schedule conflicts error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};
