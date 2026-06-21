import { Router } from 'express';
import {
  register,
  verifyOTP,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../controllers/auth.controller.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/register', otpLimiter, register);
router.post('/register/verify', otpLimiter, verifyOTP);
router.post('/login', authLimiter, login);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password/verify', otpLimiter, verifyResetOtp);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
