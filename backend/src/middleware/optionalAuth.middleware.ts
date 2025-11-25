import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Optional Authentication Middleware
 * Allows both authenticated and anonymous users
 * If token is present and valid, attaches user to request
 * If not, continues without user
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token, continue as anonymous
            return next();
        }

        const token = authHeader.substring(7);
        const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            // Token in this app uses userId, but keep fallback to id for safety
            const userId = decoded.userId || decoded.id;
            req.user = {
                id: userId,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name,
            } as any;
        } catch {
            // Invalid token, continue as anonymous
            console.log('Invalid token in optional auth, continuing as anonymous');
        }

        next();
    } catch (error) {
        // Any other error, continue as anonymous
        next();
    }
};
