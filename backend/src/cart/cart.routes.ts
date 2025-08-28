import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getCart, addItemToCart, removeItemFromCart } from './cart.controller';

const router = Router();

// All routes in this file are protected
router.use(protect);

router.route('/').get(getCart);
router.route('/items').post(addItemToCart);
router.route('/items/:itemId').delete(removeItemFromCart);

export default router;
