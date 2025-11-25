import { Router } from 'express';
import { teamController } from './team.controller';
import { protect, admin } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/team-posts', teamController.create);
router.get('/team-posts', teamController.list);
router.get('/team-posts/:id', teamController.detail);
router.put('/team-posts/:id', teamController.update);
router.post('/team-posts/:id/join', teamController.join);
router.patch('/team-posts/:id/status', admin, teamController.updateStatus);
router.delete('/team-posts/:id', admin, teamController.remove);

export default router;
