import { Router } from 'express';
import { createContest, getAllContests, getContestById } from './contest.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = Router();

router.route('/').get(getAllContests).post(protect, admin, createContest);
router.route('/:id').get(getContestById);

export default router;
