import prisma from '../db';
import { findRelevantFields } from '../knowledge/scienceTechKnowledge';

/**
 * Service để lấy đầy đủ context của user cho chatbot
 */

export interface UserContext {
    userId: string;
    displayName: string;
    interests: string[];
    talents: string[];
    futureMajor?: string;
    relevantTechFields: any[];
    contestsParticipated: {
        id: string;
        title: string;
        category: string;
    }[];
    profileCompleteness: number;
}

/**
 * Lấy full context của user
 */
export async function getUserContext(userId: string): Promise<UserContext | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                contestParticipations: {
                    include: {
                        contest: {
                            select: {
                                id: true,
                                title: true,
                                category: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) return null;

        // Parse interests và talents từ JSON
        const interests = Array.isArray(user.interests)
            ? user.interests
            : (user.interests ? JSON.parse(user.interests as string) : []);

        const talents = Array.isArray(user.talents)
            ? user.talents
            : (user.talents ? JSON.parse(user.talents as string) : []);

        // Tìm tech fields liên quan
        const relevantTechFields = findRelevantFields(interests, talents);

        // Get contests participated
        const contestsParticipated = user.contestParticipations.map(p => ({
            id: p.contest.id,
            title: p.contest.title,
            category: p.contest.category || 'Chung'
        }));

        // Calculate profile completeness
        let completeness = 0;
        if (user.displayName) completeness += 20;
        if (interests.length > 0) completeness += 30;
        if (talents.length > 0) completeness += 30;
        if (user.futureMajor) completeness += 20;

        return {
            userId: user.id,
            displayName: user.displayName || user.name || 'bạn',
            interests,
            talents,
            futureMajor: user.futureMajor || undefined,
            relevantTechFields,
            contestsParticipated,
            profileCompleteness: completeness
        };
    } catch (error) {
        console.error('Error getting user context:', error);
        return null;
    }
}

/**
 * Lấy recommended contests dựa trên interests của user
 */
export async function getRecommendedContests(interests: string[], limit: number = 5) {
    try {
        // Tìm contests có category match với interests
        const contests = await prisma.contest.findMany({
            where: {
                OR: interests.map(interest => ({
                    OR: [
                        { category: { contains: interest, mode: 'insensitive' } },
                        { title: { contains: interest, mode: 'insensitive' } },
                        { description: { contains: interest, mode: 'insensitive' } }
                    ]
                }))
            },
            select: {
                id: true,
                title: true,
                category: true,
                description: true,
                registrationDeadline: true,
                prize: true
            },
            take: limit,
            orderBy: {
                registrationDeadline: 'asc'
            }
        });

        return contests.map(c => ({
            id: c.id,
            title: c.title,
            category: c.category || 'Chung',
            description: c.description,
            deadline: c.registrationDeadline,
            prize: c.prize
        }));
    } catch (error) {
        console.error('Error getting recommended contests:', error);
        return [];
    }
}

/**
 * Lấy recommended products/courses dựa trên interests
 */
export async function getRecommendedProducts(interests: string[], limit: number = 5) {
    try {
        const products = await prisma.product.findMany({
            where: {
                OR: interests.map(interest => ({
                    OR: [
                        { name: { contains: interest, mode: 'insensitive' } },
                        { description: { contains: interest, mode: 'insensitive' } }
                    ]
                }))
            },
            select: {
                id: true,
                name: true,
                price: true,
                description: true,
                type: true
            },
            take: limit
        });

        return products;
    } catch (error) {
        console.error('Error getting recommended products:', error);
        return [];
    }
}

/**
 * Format user context thành text cho AI
 */
export function formatUserContextForAI(context: UserContext): string {
    let text = `**Thông tin người dùng:**\n`;
    text += `- Tên: ${context.displayName}\n`;

    if (context.interests.length > 0) {
        text += `- Sở thích: ${context.interests.join(', ')}\n`;
    }

    if (context.talents.length > 0) {
        text += `- Năng khiếu/Kỹ năng: ${context.talents.join(', ')}\n`;
    }

    if (context.futureMajor) {
        text += `- Ngành học dự định: ${context.futureMajor}\n`;
    }

    text += `- Độ hoàn thiện profile: ${context.profileCompleteness}%\n`;

    if (context.contestsParticipated.length > 0) {
        text += `\n**Cuộc thi đã tham gia:**\n`;
        context.contestsParticipated.forEach(c => {
            text += `- ${c.title} (${c.category})\n`;
        });
    }

    if (context.relevantTechFields.length > 0) {
        text += `\n**Lĩnh vực khoa học kỹ thuật phù hợp:**\n`;
        context.relevantTechFields.forEach(field => {
            text += `- ${field.name}: ${field.description}\n`;
            text += `  Key skills: ${field.keySkills.slice(0, 3).join(', ')}\n`;
        });
    }

    return text;
}
