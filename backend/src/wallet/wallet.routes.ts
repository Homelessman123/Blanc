import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getWalletInfo, requestPayout } from './wallet.controller';

const router = Router();

router.use(protect);

router.route('/').get(getWalletInfo);
router.route('/payouts').post(requestPayout);

export default router;
