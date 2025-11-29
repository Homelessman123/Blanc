import { Router } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { connectToDatabase, getCollection } from '../lib/db.js';
import { authGuard } from '../middleware/auth.js';
import { invalidateUserCache } from '../lib/matchingEngine.js';

const router = Router();

// ============ VALIDATION HELPERS ============

/**
 * Sanitize string input - remove control characters, trim whitespace
 */
function sanitizeString(str, maxLength = 500) {
    if (typeof str !== 'string') return '';
    // Remove control characters except newlines/tabs for bio
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLength);
}

/**
 * Validate phone number format
 */
function isValidPhone(phone) {
    if (!phone) return true; // Optional field
    return /^[0-9+\-\s]{0,20}$/.test(phone);
}

/**
 * Validate notification settings structure
 */
function validateNotificationSettings(settings) {
    const validKeys = ['email', 'push', 'contestReminders', 'courseUpdates', 'marketing'];
    if (typeof settings !== 'object' || settings === null) return false;

    for (const key of Object.keys(settings)) {
        if (!validKeys.includes(key)) return false;
        if (typeof settings[key] !== 'boolean') return false;
    }
    return true;
}

/**
 * Validate privacy settings structure
 */
function validatePrivacySettings(settings) {
    const validKeys = ['showProfile', 'showActivity', 'showAchievements'];
    if (typeof settings !== 'object' || settings === null) return false;

    for (const key of Object.keys(settings)) {
        if (!validKeys.includes(key)) return false;
        if (typeof settings[key] !== 'boolean') return false;
    }
    return true;
}

// Default shapes for extended profile data
const DEFAULT_MATCHING_PROFILE = {
    primaryRole: '',
    secondaryRoles: [],
    experienceLevel: '',
    yearsExperience: null,
    location: '',
    timeZone: '',
    languages: [],
    skills: [],
    techStack: [],
    remotePreference: '',
    availability: '',
    collaborationStyle: '',
    communicationTools: [],
    openToNewTeams: true,
    openToMentor: false,
};

const DEFAULT_CONTEST_PREFERENCES = {
    contestInterests: [],
    preferredContestFormats: [],
    preferredTeamRole: '',
    preferredTeamSize: '',
    learningGoals: '',
    strengths: '',
    achievements: '',
    portfolioLinks: [],
};

const DEFAULT_CONSENTS = {
    allowMatching: true,
    allowRecommendations: true,
    shareExtendedProfile: false,
};

/**
 * Sanitize an array of strings (comma separated string also supported)
 */
function sanitizeStringArray(value, maxItems = 15, maxLength = 50) {
    const rawArray = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(',')
            : [];

    return rawArray
        .map(item => sanitizeString(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems);
}

/**
 * Sanitize number within bounds, otherwise return null
 */
function sanitizeNumber(value, min = 0, max = 50) {
    const num = Number(value);
    if (Number.isFinite(num) && num >= min && num <= max) {
        return num;
    }
    return null;
}

/**
 * Sanitize URLs list (best effort)
 */
function sanitizeUrlList(value, maxItems = 5) {
    const urls = sanitizeStringArray(value, maxItems, 300);
    const urlPattern = /^https?:\/\//i;
    return urls.filter(url => urlPattern.test(url));
}

/**
 * Normalize matching profile payload
 */
function sanitizeMatchingProfile(input = {}) {
    const source = typeof input === 'object' && input !== null ? input : {};
    return {
        ...DEFAULT_MATCHING_PROFILE,
        primaryRole: sanitizeString(source.primaryRole, 80),
        secondaryRoles: sanitizeStringArray(source.secondaryRoles, 10, 50),
        experienceLevel: sanitizeString(source.experienceLevel, 50),
        yearsExperience: sanitizeNumber(source.yearsExperience, 0, 50),
        location: sanitizeString(source.location, 120),
        timeZone: sanitizeString(source.timeZone, 80),
        languages: sanitizeStringArray(source.languages, 8, 50),
        skills: sanitizeStringArray(source.skills, 20, 50),
        techStack: sanitizeStringArray(source.techStack, 20, 50),
        remotePreference: sanitizeString(source.remotePreference, 50),
        availability: sanitizeString(source.availability, 200),
        collaborationStyle: sanitizeString(source.collaborationStyle, 200),
        communicationTools: sanitizeStringArray(source.communicationTools, 10, 50),
        openToNewTeams: typeof source.openToNewTeams === 'boolean' ? source.openToNewTeams : true,
        openToMentor: !!source.openToMentor,
    };
}

/**
 * Normalize contest preference payload
 */
function sanitizeContestPreferences(input = {}) {
    const source = typeof input === 'object' && input !== null ? input : {};
    return {
        ...DEFAULT_CONTEST_PREFERENCES,
        contestInterests: sanitizeStringArray(source.contestInterests, 15, 50),
        preferredContestFormats: sanitizeStringArray(source.preferredContestFormats, 10, 50),
        preferredTeamRole: sanitizeString(source.preferredTeamRole, 80),
        preferredTeamSize: sanitizeString(source.preferredTeamSize, 50),
        learningGoals: sanitizeString(source.learningGoals, 400),
        strengths: sanitizeString(source.strengths, 400),
        achievements: sanitizeString(source.achievements, 500),
        portfolioLinks: sanitizeUrlList(source.portfolioLinks, 5),
    };
}

/**
 * Normalize consent flags
 */
function sanitizeConsents(consents = {}) {
    const source = typeof consents === 'object' && consents !== null ? consents : {};
    return {
        allowMatching: source.allowMatching !== false,
        allowRecommendations: source.allowRecommendations !== false,
        shareExtendedProfile: !!source.shareExtendedProfile,
    };
}

// ============ ROUTES ============

/**
 * GET /api/users/search
 * Search users by name or email for tagging/inviting
 * Protected route - requires authentication
 */
router.get('/search', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();
        const userId = req.user.id;
        const { q, limit = 8 } = req.query;

        // Validate and sanitize search query
        const query = sanitizeString(q, 100);
        if (!query || query.length < 2) {
            return res.json({ users: [] });
        }

        // Escape regex special characters
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: escapedQuery, $options: 'i' };

        const users = getCollection('users');

        // Search by name or email, exclude current user
        const results = await users.find(
            {
                _id: { $ne: new ObjectId(userId) },
                $or: [
                    { name: searchRegex },
                    { email: searchRegex }
                ],
                // Only search users who allow being found (optional privacy check)
                // 'privacy.showProfile': { $ne: false }
            },
            {
                projection: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    avatar: 1,
                    'matchingProfile.primaryRole': 1
                }
            }
        )
            .limit(Math.min(parseInt(limit) || 8, 20))
            .toArray();

        res.json({
            users: results.map(user => ({
                id: user._id.toString(),
                name: user.name || 'Unknown',
                email: user.email,
                avatar: user.avatar || null,
                role: user.matchingProfile?.primaryRole || null
            }))
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/me/settings
 * Get current user's full settings
 */
router.get('/me/settings', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();
        const userId = req.user.id;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const users = getCollection('users');
        const user = await users.findOne(
            { _id: new ObjectId(userId) },
            {
                projection: {
                    password: 0, // Never return password
                    resetPasswordToken: 0,
                    resetPasswordExpiry: 0,
                }
            }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user settings with defaults
        res.json({
            id: user._id.toString(),
            name: user.name || '',
            email: user.email,
            avatar: user.avatar || '',
            phone: user.phone || '',
            bio: user.bio || '',
            matchingProfile: {
                ...DEFAULT_MATCHING_PROFILE,
                ...(user.matchingProfile || {})
            },
            contestPreferences: {
                ...DEFAULT_CONTEST_PREFERENCES,
                ...(user.contestPreferences || {})
            },
            consents: {
                ...DEFAULT_CONSENTS,
                ...(user.consents || {})
            },
            notifications: user.notifications || {
                email: true,
                push: true,
                contestReminders: true,
                courseUpdates: true,
                marketing: false,
            },
            privacy: user.privacy || {
                showProfile: true,
                showActivity: true,
                showAchievements: true,
            },
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/users/me/profile
 * Update user profile (name, phone, bio)
 */
router.patch('/me/profile', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();
        const userId = req.user.id;
        const {
            name,
            phone,
            bio,
            matchingProfile,
            contestPreferences,
            consents,
        } = req.body || {};

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Validate and sanitize inputs
        const sanitizedName = sanitizeString(name, 100);
        const sanitizedPhone = sanitizeString(phone, 20);
        const sanitizedBio = sanitizeString(bio, 500);

        if (!sanitizedName) {
            return res.status(400).json({ error: 'Name is required.' });
        }

        if (sanitizedName.length > 100) {
            return res.status(400).json({ error: 'Name must be 100 characters or less.' });
        }

        if (!isValidPhone(sanitizedPhone)) {
            return res.status(400).json({ error: 'Invalid phone number format.' });
        }

        const sanitizedMatchingProfile = sanitizeMatchingProfile(matchingProfile);
        const sanitizedContestPreferences = sanitizeContestPreferences(contestPreferences);
        const sanitizedConsents = sanitizeConsents(consents);

        const users = getCollection('users');
        const updateData = {
            name: sanitizedName,
            phone: sanitizedPhone,
            bio: sanitizedBio,
            matchingProfile: sanitizedMatchingProfile,
            contestPreferences: sanitizedContestPreferences,
            consents: sanitizedConsents,
            updatedAt: new Date(),
        };

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Invalidate matching cache when profile is updated
        try {
            invalidateUserCache(userId);
        } catch (cacheError) {
            console.warn('[Users] Failed to invalidate matching cache:', cacheError.message);
            // Non-critical, continue
        }

        res.json({
            message: 'Profile updated successfully.',
            updated: {
                name: sanitizedName,
                phone: sanitizedPhone,
                bio: sanitizedBio,
                matchingProfile: sanitizedMatchingProfile,
                contestPreferences: sanitizedContestPreferences,
                consents: sanitizedConsents,
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/users/me/change-password
 * Change user password (requires current password)
 */
router.post('/me/change-password', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body || {};

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        if (newPassword.length > 128) {
            return res.status(400).json({ error: 'Password must be 128 characters or less.' });
        }

        const users = getCollection('users');
        const user = await users.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ error: 'New password must be different from current password.' });
        }

        // Hash new password with bcrypt (12 rounds for security)
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    password: hashedPassword,
                    updatedAt: new Date(),
                },
                // Invalidate any password reset tokens
                $unset: {
                    resetPasswordToken: '',
                    resetPasswordExpiry: '',
                }
            }
        );

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/users/me/notifications
 * Update notification preferences
 */
router.patch('/me/notifications', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();
        const userId = req.user.id;
        const settings = req.body;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        if (!validateNotificationSettings(settings)) {
            return res.status(400).json({ error: 'Invalid notification settings format.' });
        }

        const users = getCollection('users');

        // Only update valid boolean fields
        const validSettings = {
            'notifications.email': !!settings.email,
            'notifications.push': !!settings.push,
            'notifications.contestReminders': !!settings.contestReminders,
            'notifications.courseUpdates': !!settings.courseUpdates,
            'notifications.marketing': !!settings.marketing,
        };

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    ...validSettings,
                    updatedAt: new Date(),
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Notification settings updated successfully.' });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/users/me/privacy
 * Update privacy settings
 */
router.patch('/me/privacy', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();
        const userId = req.user.id;
        const settings = req.body;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        if (!validatePrivacySettings(settings)) {
            return res.status(400).json({ error: 'Invalid privacy settings format.' });
        }

        const users = getCollection('users');

        // Only update valid boolean fields
        const validSettings = {
            'privacy.showProfile': !!settings.showProfile,
            'privacy.showActivity': !!settings.showActivity,
            'privacy.showAchievements': !!settings.showAchievements,
        };

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    ...validSettings,
                    updatedAt: new Date(),
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Privacy settings updated successfully.' });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/users/me/avatar
 * Update user avatar URL (after uploading to Google Drive)
 */
router.patch('/me/avatar', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();
        const userId = req.user.id;
        const { avatarUrl } = req.body || {};

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Validate avatar URL
        if (!avatarUrl || typeof avatarUrl !== 'string') {
            return res.status(400).json({ error: 'Avatar URL is required.' });
        }

        // Basic URL validation - allow Google Drive URLs and common image URLs
        const urlPattern = /^https:\/\/(drive\.google\.com|lh3\.googleusercontent\.com|.*\.googleusercontent\.com|ui-avatars\.com)/i;
        if (!urlPattern.test(avatarUrl) && avatarUrl.length > 500) {
            return res.status(400).json({ error: 'Invalid avatar URL format.' });
        }

        const users = getCollection('users');

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    avatar: avatarUrl,
                    updatedAt: new Date(),
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Avatar updated successfully.',
            avatar: avatarUrl
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/me/notifications-history
 * Get user's notification history from notification_logs collection
 */
router.get('/me/notifications-history', authGuard, async (req, res, next) => {
    try {
        await connectToDatabase();
        const userId = req.user.id;
        const { limit = 20, skip = 0 } = req.query;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Get user email to filter notifications
        const users = getCollection('users');
        const user = await users.findOne(
            { _id: new ObjectId(userId) },
            { projection: { email: 1 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get notifications sent to this user
        const notificationLogs = getCollection('notification_logs');

        // Query for notifications - both individual and bulk
        const notifications = await notificationLogs
            .find({
                $or: [
                    { recipientEmail: user.email },
                    { type: 'announcement' }, // System announcements sent to all
                    { type: { $in: ['contestReminder', 'courseUpdate'] } } // User-specific
                ]
            })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .toArray();

        res.json({
            notifications: notifications.map(n => ({
                id: n._id.toString(),
                type: n.type,
                title: n.title || getNotificationTitle(n.type),
                message: n.message || getNotificationMessage(n),
                createdAt: n.createdAt,
                isRead: n.readBy?.includes(userId) || false,
            })),
            total: await notificationLogs.countDocuments({
                $or: [
                    { recipientEmail: user.email },
                    { type: 'announcement' }
                ]
            })
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Helper: Get notification title by type
 */
function getNotificationTitle(type) {
    const titles = {
        contestReminder: '🔔 Nhắc nhở cuộc thi',
        courseUpdate: '📚 Cập nhật khóa học',
        announcement: '📢 Thông báo hệ thống',
        welcome: '🎉 Chào mừng',
        contestRegistration: '✅ Đăng ký thành công',
    };
    return titles[type] || 'Thông báo';
}

/**
 * Helper: Get notification message
 */
function getNotificationMessage(notification) {
    if (notification.message) return notification.message;

    switch (notification.type) {
        case 'contestReminder':
            return `Cuộc thi sắp bắt đầu`;
        case 'courseUpdate':
            return `Khóa học có nội dung mới`;
        case 'announcement':
            return notification.title || 'Thông báo từ hệ thống';
        default:
            return 'Bạn có thông báo mới';
    }
}

export default router;
