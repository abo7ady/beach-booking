import { Router } from 'express';
import {
  getMyNotifications,
  getAllNotifications,
  markAsRead,
  toggleReadStatus,
  markAllAsRead,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getMyNotifications);
router.get('/all', getAllNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.put('/:id/toggle', toggleReadStatus);

export default router;
