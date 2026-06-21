import Booking from '../models/Booking.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import { recomputeTrending } from '../utils/recomputeTrending.js';

// ── Create Booking (User) ────────────────────────────────────
export const createBooking = async (req, res, next) => {
  try {
    const { activityId, desiredDate } = req.body;

    // Validate activity exists and is active
    const activity = await Activity.findById(activityId);
    if (!activity || !activity.isActive)
      return res.status(404).json({ error: 'Activity not found' });

    // Validate date is in the future
    if (new Date(desiredDate) <= new Date())
      return res.status(400).json({ error: 'Please select a future date' });

    const booking = await Booking.create({
      user: req.user.id,
      activity: activityId,
      desiredDate,
      statusHistory: [
        {
          status: 'New',
          changedBy: req.user.id,
          note: 'Booking submitted',
        },
      ],
    });

    const populated = await booking.populate('activity', 'title images price');

    await Notification.create({
      recipient: 'admin',
      title: 'New Booking',
      message: `A new booking was placed for ${populated.activity.title}.`,
      type: 'booking_new',
      targetUrl: '/admin',
    });

    return res.status(201).json({ booking: populated });
  } catch (err) {
    next(err);
  }
};

// ── My Bookings (User) ──────────────────────────────────────
export const getMyBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find({ user: req.user.id })
        .populate('activity', 'title images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments({ user: req.user.id }),
    ]);

    return res.json({
      bookings,
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

// ── All Bookings (Admin) ────────────────────────────────────
export const getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email whatsappNumber telegram instagram snapchat messenger')
        .populate('activity', 'title images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(filter),
    ]);

    return res.json({
      bookings,
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

// ── Update Booking Status (Admin) ────────────────────────────
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const prevStatus = booking.status;

    booking.status = status;
    booking.adminNote = adminNote || booking.adminNote;
    booking.statusHistory.push({
      status,
      changedBy: req.user.id,
      note: adminNote,
    });
    await booking.save();

    // ── Popularity score logic ──────────────────────────────
    if (status === 'Confirmed' && prevStatus !== 'Confirmed') {
      await Activity.findByIdAndUpdate(booking.activity, {
        $inc: { popularityScore: 1 },
      });
      await recomputeTrending();
    }
    if (prevStatus === 'Confirmed' && status !== 'Confirmed') {
      await Activity.findByIdAndUpdate(booking.activity, {
        $inc: { popularityScore: -1 },
      });
      await recomputeTrending();
    }

    const populated = await booking.populate([
      { path: 'user', select: 'name email whatsappNumber telegram instagram snapchat messenger' },
      { path: 'activity', select: 'title images price' },
    ]);

    if (status !== prevStatus) {
      await Notification.create({
        recipient: booking.user,
        title: 'Booking Status Updated',
        message: `Your booking for ${populated.activity.title} is now ${status}.`,
        type: 'booking_status',
        targetUrl: '/profile',
      });
    }

    return res.json({ booking: populated });
  } catch (err) {
    next(err);
  }
};
