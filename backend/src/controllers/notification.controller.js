import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

// Helper: build the query filter based on user role
const buildQuery = (user) => {
  return user.role === 'admin'
    ? { $or: [{ recipient: 'admin' }, { recipient: user.id }, { user: user.id }] }
    : { $or: [{ recipient: user.id }, { user: user.id }] };
};

// ── Get recent notifications (popover bell) ──────────────────
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find(buildQuery(req.user))
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

// ── Get ALL notifications (paginated, full page) ─────────────
export const getAllNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = buildQuery(req.user);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Mark single notification as read ─────────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid Notification ID' });
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    if (
      notification.recipient !== 'admin' &&
      notification.recipient?.toString() !== req.user.id &&
      notification.user?.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();
    res.json({ notification });
  } catch (err) {
    next(err);
  }
};

// ── Toggle read/unread for a single notification ─────────────
export const toggleReadStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid Notification ID' });
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    if (
      notification.recipient !== 'admin' &&
      notification.recipient?.toString() !== req.user.id &&
      notification.user?.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    notification.isRead = !notification.isRead;
    await notification.save();
    res.json({ notification });
  } catch (err) {
    next(err);
  }
};

// ── Mark ALL notifications as read ───────────────────────────
export const markAllAsRead = async (req, res, next) => {
  try {
    const query = { ...buildQuery(req.user), isRead: false };
    await Notification.updateMany(query, { $set: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
