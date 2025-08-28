import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from './product.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.route('/').get(getProducts).post(protect, createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

export default router;
