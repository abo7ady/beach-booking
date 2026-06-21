import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../config/cloudinary.js';

const router = Router();

router.get('/', protect, getProfile);
router.put('/', protect, upload.single('profilePicture'), updateProfile);

export default router;
