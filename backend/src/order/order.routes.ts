import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createOrder, getMyOrders, getOrderById } from './order.controller';

const router = Router();

// All routes in this file are protected
router.use(protect);

router.route('/').post(createOrder);
router.route('/myorders').get(getMyOrders);
router.route('/:id').get(getOrderById);

export default router;
