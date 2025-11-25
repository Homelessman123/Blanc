import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { notifyContestRegistration } from '../services/googleAppsScript.service';

const prisma = new PrismaClient();

// Create contest registration
export const createContestRegistration = async (req: Request, res: Response) => {
    try {
        const {
            contestId,
            userId,
            fullName,
            email,
            phone,
            school,
            grade,
            birthDate,
            parentPhone,
            reason,
        } = req.body;

        // Validation
        if (!contestId || !userId || !fullName || !email || !phone || !school || !grade || !birthDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
            });
        }

        // Check if user already registered
        const existingRegistration = await prisma.contestParticipation.findUnique({
            where: {
                userId_contestId: {
                    userId,
                    contestId,
                },
            },
        });

        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đăng ký cuộc thi này rồi',
            });
        }

        // Create registration
        const registration = await prisma.contestParticipation.create({
            data: {
                userId,
                contestId,
                fullName,
                email,
                phone,
                school,
                grade,
                birthDate: new Date(birthDate),
                parentPhone,
                reason,
                status: 'PENDING',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                contest: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        startDate: true,
                        endDate: true,
                        registrationDeadline: true,
                    },
                },
            },
        });

        // Update contest participant count
        await prisma.contest.update({
            where: { id: contestId },
            data: {
                currentParticipants: {
                    increment: 1,
                },
            },
        });

        // Tạo calendar event lưu trong DB
        const contest = registration.contest;
        if (contest) {
            notifyContestRegistration({
                userId,
                userEmail: email,
                userName: fullName || email,
                contestId,
                contestTitle: contest.title,
                contestDescription: contest.description || '',
                startDate: contest.startDate,
                endDate: contest.endDate,
                registrationDeadline: contest.registrationDeadline || undefined,
            }).catch((err) => console.error('Contest calendar create failed:', err));
        }

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: registration,
        });
    } catch (error: any) {
        console.error('Contest registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi đăng ký cuộc thi',
            error: error.message,
        });
    }
};

// Get user's contest registrations
export const getUserRegistrations = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const registrations = await prisma.contestParticipation.findMany({
            where: { userId },
            include: {
                contest: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        imageUrl: true,
                        startDate: true,
                        endDate: true,
                        registrationDeadline: true,
                        organizer: true,
                        fee: true,
                        format: true,
                        targetGrade: true,
                    },
                },
            },
            orderBy: {
                joinedAt: 'desc',
            },
        });

        res.status(200).json({
            success: true,
            data: registrations,
        });
    } catch (error: any) {
        console.error('Get registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi khi lấy danh sách đăng ký',
            error: error.message,
        });
    }
};

// Get contest registrations (for admin)
export const getContestRegistrations = async (req: Request, res: Response) => {
    try {
        const { contestId } = req.params;
        const { status } = req.query;

        const where: any = { contestId };
        if (status) {
            where.status = status;
        }

        const registrations = await prisma.contestParticipation.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                joinedAt: 'desc',
            },
        });

        res.status(200).json({
            success: true,
            data: registrations,
        });
    } catch (error: any) {
        console.error('Get contest registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi khi lấy danh sách đăng ký',
            error: error.message,
        });
    }
};

// Update registration status
export const updateRegistrationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ',
            });
        }

        const registration = await prisma.contestParticipation.update({
            where: { id },
            data: { status },
            include: {
                user: true,
                contest: true,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data: registration,
        });
    } catch (error: any) {
        console.error('Update registration status error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi khi cập nhật trạng thái',
            error: error.message,
        });
    }
};

// Cancel registration
export const cancelRegistration = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const registration = await prisma.contestParticipation.findUnique({
            where: { id },
            include: { contest: true },
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đăng ký',
            });
        }

        if (registration.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền hủy đăng ký này',
            });
        }

        // Update status to cancelled
        await prisma.contestParticipation.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        // Decrease participant count
        await prisma.contest.update({
            where: { id: registration.contestId },
            data: {
                currentParticipants: {
                    decrement: 1,
                },
            },
        });

        res.status(200).json({
            success: true,
            message: 'Hủy đăng ký thành công',
        });
    } catch (error: any) {
        console.error('Cancel registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi khi hủy đăng ký',
            error: error.message,
        });
    }
};
