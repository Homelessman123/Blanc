import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  checkEmail,
  register,
  login,
  getMe,
  savePreferences,
  updateProfile,
  getAllUsers,
  updateUserRole,
  deleteUser,
  requestPasswordReset,
  verifyPasswordReset,
  completePasswordResetHandler,
} from './auth.controller';
import { protect, admin } from '../middleware/auth.middleware';
import { validateProfileUpdate, profileRateLimitConfig } from '../middleware/profileValidation.middleware';

const router = Router();

// Rate limiter cho profile update
const profileRateLimiter = rateLimit(profileRateLimitConfig);

router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/verify', verifyPasswordReset);
router.post('/password-reset/complete', completePasswordResetHandler);
router.get('/me', protect, getMe);
router.post('/preferences', protect, validateProfileUpdate, savePreferences);
router.put('/profile', protect, profileRateLimiter, validateProfileUpdate, updateProfile);
router.get('/users', protect, admin, getAllUsers);
router.patch('/users/:id/role', protect, admin, updateUserRole);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
