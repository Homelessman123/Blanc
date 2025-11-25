import { Router } from 'express';
import { protect, admin } from '../middleware/auth.middleware';
import { listAuditLogs } from './audit.controller';

const router = Router();

router.use(protect, admin);
router.get('/audit-logs', listAuditLogs);

export default router;
