import Favorite from '../models/Favorite.js';

// ── Get User Favorites ───────────────────────────────────────
export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate('activity')
      .sort({ createdAt: -1 });

    // Filter out inactive activities
    const activeFavorites = favorites.filter(
      (f) => f.activity && f.activity.isActive
    );

    return res.json({
      favorites: activeFavorites.map((f) => f.activity),
      ids: activeFavorites.map((f) => f.activity._id),
    });
  } catch (err) {
    next(err);
  }
};

// ── Toggle Favorite ──────────────────────────────────────────
export const toggleFavorite = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const existing = await Favorite.findOne({
      user: req.user.id,
      activity: activityId,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ favorited: false, message: 'Removed from favorites' });
    }
    await Favorite.create({ user: req.user.id, activity: activityId });
    return res.json({ favorited: true, message: 'Added to favorites' });
  } catch (err) {
    next(err);
  }
};
