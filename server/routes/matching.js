/**
 * ============================================================================
 * MATCHING API ROUTES
 * ============================================================================
 * 
 * Endpoints for teammate matching and recommendations.
 * 
 * Features:
 * - GET /api/matching/recommendations - Get 5 diverse teammate recommendations
 * - GET /api/matching/score/:userId - Get match score with specific user
 * - POST /api/matching/refresh - Force refresh recommendations (clear cache)
 * - GET /api/matching/stats - Get cache statistics (admin only)
 * 
 * Security:
 * - Authentication required for all endpoints
 * - Rate limiting to prevent abuse
 * - Privacy consent checks
 * - No sensitive data exposure
 */

import { Router } from 'express';
import { connectToDatabase, getCollection } from '../lib/db.js';
import { authGuard } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import {
    getRecommendedTeammates,
    getMatchScoreBetweenUsers,
    invalidateUserCache,
    getCacheStats
} from '../lib/matchingEngine.js';
import { ObjectId } from 'mongodb';

const router = Router();

// ============================================================================
// RATE LIMITING
// ============================================================================

// Standard rate limit for recommendations (more permissive)
const recommendationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: { error: 'Quá nhiều yêu cầu. Vui lòng đợi một chút.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limit for score calculations (prevent enumeration)
const scoreLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: { error: 'Quá nhiều yêu cầu. Vui lòng đợi một chút.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict limit for cache refresh (prevent abuse)
const refreshLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 refreshes per hour
    message: { error: 'Bạn chỉ có thể làm mới 5 lần mỗi giờ.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate ObjectId format
 */
function isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Sanitize query parameters
 */
function sanitizeQueryParams(query) {
    return {
        contestId: query.contestId && isValidObjectId(query.contestId) ? query.contestId : null,
        twoWay: query.twoWay !== 'false', // Default true
        limit: Math.min(Math.max(parseInt(query.limit) || 5, 1), 10), // 1-10, default 5
    };
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/matching/recommendations
 * Get diverse teammate recommendations for the authenticated user
 * 
 * Query params:
 * - contestId: Optional contest ID for context-specific matching
 * - twoWay: Whether to use two-way matching (default: true)
 * - limit: Number of recommendations (1-10, default: 5)
 */
router.get('/recommendations', authGuard, recommendationLimiter, async (req, res, next) => {
    try {
        await connectToDatabase();

        const userId = req.user?.id;
        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if user has consented to matching
        const usersCollection = getCollection('users');
        const user = await usersCollection.findOne(
            { _id: new ObjectId(userId) },
            { projection: { 'consents.allowMatching': 1, 'matchingProfile.openToNewTeams': 1 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        if (!user.consents?.allowMatching) {
            return res.status(403).json({
                error: 'Bạn cần bật tính năng ghép đội trong cài đặt hồ sơ',
                code: 'MATCHING_DISABLED'
            });
        }

        const params = sanitizeQueryParams(req.query);

        const recommendations = await getRecommendedTeammates(userId, {
            contestId: params.contestId,
            twoWay: params.twoWay,
            limit: params.limit,
            excludeUserIds: []
        });

        res.json({
            success: true,
            count: recommendations.length,
            matchingMode: params.twoWay ? 'two-way' : 'one-way',
            contestId: params.contestId,
            recommendations,
            meta: {
                cached: true, // Engine handles caching
                cacheTTL: '6 hours',
                maxScore: 100,
                teamSize: 6 // Including the requesting user
            }
        });

    } catch (error) {
        console.error('[Matching API] Recommendations error:', error);
        next(error);
    }
});

/**
 * GET /api/matching/score/:targetUserId
 * Get compatibility score with a specific user
 * 
 * Query params:
 * - twoWay: Whether to calculate two-way score (default: true)
 */
router.get('/score/:targetUserId', authGuard, scoreLimiter, async (req, res, next) => {
    try {
        await connectToDatabase();

        const userId = req.user?.id;
        const targetUserId = req.params.targetUserId;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!targetUserId || !isValidObjectId(targetUserId)) {
            return res.status(400).json({ error: 'ID người dùng không hợp lệ' });
        }

        if (userId === targetUserId) {
            return res.status(400).json({ error: 'Không thể so sánh với chính mình' });
        }

        // Check privacy consents for both users
        const usersCollection = getCollection('users');
        const [currentUser, targetUser] = await Promise.all([
            usersCollection.findOne(
                { _id: new ObjectId(userId) },
                { projection: { 'consents.allowMatching': 1 } }
            ),
            usersCollection.findOne(
                { _id: new ObjectId(targetUserId) },
                { projection: { 'consents.allowMatching': 1, 'matchingProfile.openToNewTeams': 1 } }
            )
        ]);

        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!targetUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        if (!currentUser.consents?.allowMatching) {
            return res.status(403).json({
                error: 'Bạn cần bật tính năng ghép đội',
                code: 'MATCHING_DISABLED'
            });
        }

        if (!targetUser.consents?.allowMatching || !targetUser.matchingProfile?.openToNewTeams) {
            return res.status(403).json({
                error: 'Người dùng này không mở ghép đội',
                code: 'TARGET_NOT_AVAILABLE'
            });
        }

        const twoWay = req.query.twoWay !== 'false';
        const scoreResult = await getMatchScoreBetweenUsers(userId, targetUserId, twoWay);

        res.json({
            success: true,
            ...scoreResult,
            meta: {
                matchingMode: twoWay ? 'two-way' : 'one-way',
                maxScore: 100
            }
        });

    } catch (error) {
        console.error('[Matching API] Score error:', error);
        next(error);
    }
});

/**
 * POST /api/matching/refresh
 * Force refresh recommendations (clears cache for the user)
 */
router.post('/refresh', authGuard, refreshLimiter, async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Clear user's cache
        invalidateUserCache(userId);

        // Optionally get fresh recommendations
        const params = sanitizeQueryParams(req.query);

        await connectToDatabase();

        const recommendations = await getRecommendedTeammates(userId, {
            contestId: params.contestId,
            twoWay: params.twoWay,
            limit: params.limit,
            skipCache: true
        });

        res.json({
            success: true,
            message: 'Đã làm mới gợi ý đồng đội',
            count: recommendations.length,
            recommendations
        });

    } catch (error) {
        console.error('[Matching API] Refresh error:', error);
        next(error);
    }
});

/**
 * GET /api/matching/stats
 * Get cache statistics (admin only)
 */
router.get('/stats', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if admin
        const usersCollection = getCollection('users');
        const user = await usersCollection.findOne(
            { _id: new ObjectId(userId) },
            { projection: { role: 1 } }
        );

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const stats = getCacheStats();

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('[Matching API] Stats error:', error);
        next(error);
    }
});

/**
 * GET /api/matching/profile-completion
 * Get profile completion status for matching quality
 */
router.get('/profile-completion', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();

        const userId = req.user?.id;
        if (!userId || !isValidObjectId(userId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const usersCollection = getCollection('users');
        const user = await usersCollection.findOne(
            { _id: new ObjectId(userId) },
            { projection: { matchingProfile: 1, contestPreferences: 1, consents: 1 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        const mp = user.matchingProfile || {};
        const cp = user.contestPreferences || {};
        const consents = user.consents || {};

        // Calculate completion score
        const checks = {
            // Essential fields (higher weight)
            primaryRole: { filled: !!mp.primaryRole, weight: 15, label: 'Vai trò chính' },
            skills: { filled: (mp.skills || []).length >= 3, weight: 15, label: 'Kỹ năng (ít nhất 3)' },
            experienceLevel: { filled: !!mp.experienceLevel, weight: 10, label: 'Cấp độ kinh nghiệm' },
            availability: { filled: !!mp.availability, weight: 10, label: 'Lịch làm việc' },

            // Important fields (medium weight)
            techStack: { filled: (mp.techStack || []).length >= 2, weight: 8, label: 'Tech stack (ít nhất 2)' },
            location: { filled: !!mp.location, weight: 5, label: 'Địa điểm' },
            timeZone: { filled: !!mp.timeZone, weight: 5, label: 'Múi giờ' },
            languages: { filled: (mp.languages || []).length >= 1, weight: 5, label: 'Ngôn ngữ' },
            communicationTools: { filled: (mp.communicationTools || []).length >= 1, weight: 5, label: 'Công cụ giao tiếp' },

            // Nice to have (lower weight)
            secondaryRoles: { filled: (mp.secondaryRoles || []).length >= 1, weight: 4, label: 'Vai trò phụ' },
            collaborationStyle: { filled: !!mp.collaborationStyle, weight: 4, label: 'Phong cách làm việc' },
            contestInterests: { filled: (cp.contestInterests || []).length >= 1, weight: 4, label: 'Sở thích cuộc thi' },
            strengths: { filled: !!cp.strengths, weight: 3, label: 'Điểm mạnh' },
            learningGoals: { filled: !!cp.learningGoals, weight: 3, label: 'Mục tiêu học tập' },

            // Consent settings
            allowMatching: { filled: !!consents.allowMatching, weight: 4, label: 'Bật ghép đội thông minh' }
        };

        const totalWeight = Object.values(checks).reduce((sum, c) => sum + c.weight, 0);
        const filledWeight = Object.values(checks)
            .filter(c => c.filled)
            .reduce((sum, c) => sum + c.weight, 0);

        const completionPercent = Math.round((filledWeight / totalWeight) * 100);

        const missing = Object.entries(checks)
            .filter(([_, c]) => !c.filled)
            .map(([key, c]) => ({ field: key, label: c.label, weight: c.weight }))
            .sort((a, b) => b.weight - a.weight);

        const filled = Object.entries(checks)
            .filter(([_, c]) => c.filled)
            .map(([key, c]) => ({ field: key, label: c.label }));

        res.json({
            success: true,
            completionPercent,
            status: completionPercent >= 80 ? 'excellent' :
                completionPercent >= 60 ? 'good' :
                    completionPercent >= 40 ? 'fair' : 'incomplete',
            filled,
            missing,
            tips: getTipsForMissingFields(missing)
        });

    } catch (error) {
        console.error('[Matching API] Profile completion error:', error);
        next(error);
    }
});

/**
 * Get tips for improving profile completion
 */
function getTipsForMissingFields(missing) {
    const tips = [];
    const missingFields = missing.map(m => m.field);

    if (missingFields.includes('primaryRole')) {
        tips.push('🎯 Thêm vai trò chính để tăng 15% độ phù hợp ghép đội');
    }
    if (missingFields.includes('skills')) {
        tips.push('💡 Thêm ít nhất 3 kỹ năng để hệ thống tìm đồng đội phù hợp hơn');
    }
    if (missingFields.includes('availability')) {
        tips.push('📅 Cập nhật lịch rảnh để ghép với người có thời gian tương đồng');
    }
    if (missingFields.includes('allowMatching')) {
        tips.push('⚙️ Bật "Ghép đội thông minh" trong cài đặt để nhận gợi ý');
    }

    return tips.slice(0, 3); // Return top 3 tips
}

export default router;
