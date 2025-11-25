import { Router } from 'express';
import {
    updateUserStreak,
    getUsersStreak,
    syncContestRegistration,
    getActiveContests,
    healthCheck,
} from './sync.controller';

const router = Router();

// Health check
router.get('/health', healthCheck);

// User streak endpoints
router.post('/user-streak', updateUserStreak);
router.get('/users/streak', getUsersStreak);

// Contest registration endpoints
router.post('/contest-registration', syncContestRegistration);
router.get('/contests', getActiveContests);

export default router;
