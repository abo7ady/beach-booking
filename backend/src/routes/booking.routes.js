import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
} from '../controllers/booking.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';

const router = Router();

// User routes
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);

// Admin routes
router.get('/', protect, adminOnly, getAllBookings);
router.patch('/:id/status', protect, adminOnly, updateBookingStatus);

export default router;
