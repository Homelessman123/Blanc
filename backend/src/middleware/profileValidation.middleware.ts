import { Request, Response, NextFunction } from 'express';

/**
 * Profile Validation Middleware
 * Đảm bảo bảo mật và validate dữ liệu trước khi lưu vào database
 */

// Các ký tự đặc biệt nguy hiểm cần được sanitize
const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS script tags
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /data:/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
];

// Danh sách màu hợp lệ (hex colors)
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Giới hạn độ dài
const LIMITS = {
    name: { min: 1, max: 100 },
    displayName: { min: 1, max: 50 },
    phoneNumber: { min: 0, max: 15 },
    location: { min: 0, max: 100 },
    futureMajor: { min: 0, max: 100 },
    interests: { maxItems: 20, maxItemLength: 50 },
    talents: { maxItems: 20, maxItemLength: 50 },
    profileGif: { maxLength: 500 },
};

/**
 * Sanitize string để ngăn XSS
 */
export const sanitizeString = (str: string | undefined | null): string => {
    if (!str) return '';

    let sanitized = str.trim();

    // Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Escape HTML entities
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

    return sanitized;
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (arr: any, maxItems: number, maxItemLength: number): string[] => {
    if (!Array.isArray(arr)) return [];

    return arr
        .slice(0, maxItems) // Giới hạn số lượng items
        .map((item: any) => {
            if (typeof item !== 'string') return '';
            return sanitizeString(item).substring(0, maxItemLength);
        })
        .filter((item: string) => item.length > 0); // Remove empty strings
};

/**
 * Validate hex color
 */
export const isValidHexColor = (color: string | undefined | null): boolean => {
    if (!color) return true; // undefined/null is valid (optional field)
    return HEX_COLOR_REGEX.test(color);
};

/**
 * Validate phone number (chỉ cho phép số và một số ký tự đặc biệt)
 */
export const sanitizePhoneNumber = (phone: string | undefined | null): string | null => {
    if (!phone) return null;
    // Chỉ giữ lại số, dấu + và dấu -
    const sanitized = phone.replace(/[^\d+\-\s]/g, '').trim();
    return sanitized.length > 0 ? sanitized.substring(0, LIMITS.phoneNumber.max) : null;
};

/**
 * Validate URL cho profile GIF
 */
export const isValidGifUrl = (url: string | undefined | null): boolean => {
    if (!url) return true;

    try {
        const parsed = new URL(url);
        // Chỉ cho phép http/https và phải từ server của mình hoặc các nguồn đáng tin cậy
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
        }
        // Kiểm tra extension
        const path = parsed.pathname.toLowerCase();
        if (!path.endsWith('.gif') && !path.includes('/uploads/')) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

/**
 * Middleware validate profile update request
 */
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const {
        name,
        displayName,
        profileColor,
        profileGif,
        interests,
        talents,
        futureMajor,
        phoneNumber,
        location,
    } = req.body;

    // Validate name
    if (name !== undefined) {
        if (typeof name !== 'string') {
            errors.push('Tên phải là chuỗi ký tự');
        } else if (name.length > LIMITS.name.max) {
            errors.push(`Tên không được vượt quá ${LIMITS.name.max} ký tự`);
        }
    }

    // Validate displayName
    if (displayName !== undefined) {
        if (typeof displayName !== 'string') {
            errors.push('Tên hiển thị phải là chuỗi ký tự');
        } else if (displayName.length > LIMITS.displayName.max) {
            errors.push(`Tên hiển thị không được vượt quá ${LIMITS.displayName.max} ký tự`);
        }
    }

    // Validate profileColor
    if (profileColor !== undefined && !isValidHexColor(profileColor)) {
        errors.push('Màu không hợp lệ (phải là mã hex, ví dụ: #6366f1)');
    }

    // Validate profileGif
    if (profileGif !== undefined && profileGif !== '' && !isValidGifUrl(profileGif)) {
        errors.push('URL GIF không hợp lệ');
    }

    // Validate interests
    if (interests !== undefined) {
        if (!Array.isArray(interests)) {
            errors.push('Sở thích phải là mảng');
        } else if (interests.length > LIMITS.interests.maxItems) {
            errors.push(`Số lượng sở thích không được vượt quá ${LIMITS.interests.maxItems}`);
        }
    }

    // Validate talents
    if (talents !== undefined) {
        if (!Array.isArray(talents)) {
            errors.push('Năng khiếu phải là mảng');
        } else if (talents.length > LIMITS.talents.maxItems) {
            errors.push(`Số lượng năng khiếu không được vượt quá ${LIMITS.talents.maxItems}`);
        }
    }

    // Validate futureMajor
    if (futureMajor !== undefined && futureMajor !== null) {
        if (typeof futureMajor !== 'string') {
            errors.push('Ngành học dự định phải là chuỗi ký tự');
        } else if (futureMajor.length > LIMITS.futureMajor.max) {
            errors.push(`Ngành học dự định không được vượt quá ${LIMITS.futureMajor.max} ký tự`);
        }
    }

    // Validate phoneNumber
    if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber !== '') {
        if (typeof phoneNumber !== 'string') {
            errors.push('Số điện thoại phải là chuỗi ký tự');
        } else {
            const phoneRegex = /^[\d+\-\s]{7,15}$/;
            if (!phoneRegex.test(phoneNumber)) {
                errors.push('Số điện thoại không hợp lệ');
            }
        }
    }

    // Validate location
    if (location !== undefined && location !== null && location !== '') {
        if (typeof location !== 'string') {
            errors.push('Địa điểm phải là chuỗi ký tự');
        } else if (location.length > LIMITS.location.max) {
            errors.push(`Địa điểm không được vượt quá ${LIMITS.location.max} ký tự`);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors,
        });
    }

    // Sanitize data trước khi tiếp tục
    if (name !== undefined) req.body.name = sanitizeString(name);
    if (displayName !== undefined) req.body.displayName = sanitizeString(displayName);
    if (futureMajor !== undefined) req.body.futureMajor = sanitizeString(futureMajor);
    if (location !== undefined) req.body.location = sanitizeString(location);
    if (phoneNumber !== undefined) req.body.phoneNumber = sanitizePhoneNumber(phoneNumber);
    if (interests !== undefined) {
        req.body.interests = sanitizeStringArray(interests, LIMITS.interests.maxItems, LIMITS.interests.maxItemLength);
    }
    if (talents !== undefined) {
        req.body.talents = sanitizeStringArray(talents, LIMITS.talents.maxItems, LIMITS.talents.maxItemLength);
    }

    next();
};

/**
 * Rate limiter config cho profile API
 */
export const profileRateLimitConfig = {
    windowMs: 60 * 1000, // 1 phút
    max: 10, // Tối đa 10 requests/phút
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu cập nhật. Vui lòng thử lại sau 1 phút.',
    },
    standardHeaders: true,
    legacyHeaders: false,
};
