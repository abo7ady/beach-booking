import { Router } from 'express';
import { getAllUsers, toggleUserStatus } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/admin.middleware.js';

const router = Router();

router.use(protect, adminOnly);

router.get('/', getAllUsers);
router.patch('/:id/status', toggleUserStatus);

export default router;
