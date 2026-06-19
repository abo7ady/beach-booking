import { Router } from 'express';
import { getFavorites, toggleFavorite } from '../controllers/favorite.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, getFavorites);
router.post('/:activityId', protect, toggleFavorite);

export default router;
