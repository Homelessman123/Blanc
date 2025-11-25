import { Router } from 'express';
import { createContest, getAllContests, getContestById, updateContest, deleteContest } from './contest.controller';
import {
    createContestRegistration,
    getUserRegistrations,
    getContestRegistrations,
    updateRegistrationStatus,
    cancelRegistration,
} from './contestRegistration.controller';
import { checkScheduleConflicts } from './scheduleConflict.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = Router();

router.route('/').get(getAllContests).post(protect, admin, createContest);
router.route('/:id').get(getContestById).put(protect, admin, updateContest).delete(protect, admin, deleteContest);

// Contest registration routes
router.route('/register').post(protect, createContestRegistration);
router.route('/check-conflicts').post(protect, checkScheduleConflicts);
router.route('/registrations/user/:userId').get(protect, getUserRegistrations);
router.route('/registrations/contest/:contestId').get(protect, admin, getContestRegistrations);
router.route('/registrations/:id/status').patch(protect, admin, updateRegistrationStatus);
router.route('/registrations/:id/cancel').delete(protect, cancelRegistration);

export default router;
