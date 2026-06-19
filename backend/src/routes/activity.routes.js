import { Router } from 'express';
import { upload } from '../config/cloudinary.js';
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  patchActivity,
  deleteActivity,
  hardDeleteActivity,
  adminListActivities,
} from '../controllers/activity.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';

const router = Router();

// Public routes
router.get('/', listActivities);
router.get('/:id', getActivity);

// Admin routes
router.post('/', protect, adminOnly, upload.single('image'), createActivity);
router.put('/:id', protect, adminOnly, upload.single('image'), updateActivity);
router.patch('/:id', protect, adminOnly, patchActivity);
router.delete('/:id', protect, adminOnly, deleteActivity);
router.delete('/:id/hard', protect, adminOnly, hardDeleteActivity);

// Admin list (includes inactive)
router.get('/admin/all', protect, adminOnly, adminListActivities);

export default router;
