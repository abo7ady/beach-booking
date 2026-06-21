import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import Booking from '../models/Booking.js';
import Favorite from '../models/Favorite.js';
import { uploadToCloudinary } from '../services/upload.service.js';

// ── List Activities (Public, paginated, searchable) ──────────
export const listActivities = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      trending,
      search,
      sort = 'popularity',
    } = req.query;

    const filter = { isActive: true };
    if (trending === 'true') filter.isTrending = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { popularityScore: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Activity.countDocuments(filter),
    ]);

    return res.json({
      activities,
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

// ── Get Single Activity ──────────────────────────────────────
export const getActivity = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid Activity ID' });
    const activity = await Activity.findById(req.params.id);
    if (!activity || !activity.isActive)
      return res.status(404).json({ error: 'Activity not found' });
    return res.json({ activity });
  } catch (err) {
    next(err);
  }
};

// ── Create Activity (Admin) ─────────────────────────────────
export const createActivity = async (req, res, next) => {
  try {
    const { title, description, durationMinutes, tags, price, minCapacity, maxCapacity, maxWeightLimit, mediaAlbum } = req.body;

    const newActivityData = {
      title,
      description,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      price: price ? Number(price) : undefined,
      minCapacity: minCapacity ? Number(minCapacity) : 1,
      maxCapacity: (maxCapacity && maxCapacity !== '') ? Number(maxCapacity) : null,
      maxWeightLimit: (maxWeightLimit && maxWeightLimit !== '') ? Number(maxWeightLimit) : null,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    };

    if (newActivityData.maxCapacity !== null && newActivityData.maxCapacity < newActivityData.minCapacity) {
      return res.status(400).json({ error: 'Max Capacity must be greater than or equal to Min Capacity' });
    }

    if (newActivityData.tags.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 tags allowed' });
    }

    if (mediaAlbum) {
      if (typeof mediaAlbum === 'string') {
        try {
          newActivityData.mediaAlbum = JSON.parse(mediaAlbum);
        } catch (e) {}
      } else if (Array.isArray(mediaAlbum)) {
        newActivityData.mediaAlbum = mediaAlbum;
      }
      
      if (newActivityData.mediaAlbum && newActivityData.mediaAlbum.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 media items allowed' });
      }
    }

    if (req.files && req.files.image && req.files.image[0]) {
      newActivityData.images = [req.files.image[0].path];
    }

    if (req.files && req.files.mediaFiles) {
      if (!newActivityData.mediaAlbum) newActivityData.mediaAlbum = [];
      const newMedia = req.files.mediaFiles.map(file => ({
        url: file.path,
        mediaType: 'image',
        publicId: file.filename
      }));
      newActivityData.mediaAlbum.push(...newMedia);
    }

    const activity = await Activity.create(newActivityData);
    return res.status(201).json({ activity });
  } catch (err) {
    next(err);
  }
};

// ── Update Activity (Admin — Full) ──────────────────────────
export const updateActivity = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid Activity ID' });
    const updates = { ...req.body };
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((t) => t.trim());
    }
    if (updates.durationMinutes !== undefined) {
      updates.durationMinutes = Number(updates.durationMinutes);
    }
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }
    if (updates.minCapacity !== undefined) {
      updates.minCapacity = Number(updates.minCapacity);
    }
    if (updates.maxCapacity !== undefined) {
      updates.maxCapacity = (updates.maxCapacity && updates.maxCapacity !== '') ? Number(updates.maxCapacity) : null;
    }
    if (updates.maxWeightLimit !== undefined) {
      updates.maxWeightLimit = (updates.maxWeightLimit && updates.maxWeightLimit !== '') ? Number(updates.maxWeightLimit) : null;
    }

    if (updates.mediaAlbum !== undefined && typeof updates.mediaAlbum === 'string') {
        try {
          updates.mediaAlbum = JSON.parse(updates.mediaAlbum);
        } catch (e) {}
    }

    if (updates.tags && updates.tags.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 tags allowed' });
    }
    if (updates.mediaAlbum && updates.mediaAlbum.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 media items allowed' });
    }

    const currentActivity = await Activity.findById(req.params.id);
    if (!currentActivity) return res.status(404).json({ error: 'Activity not found' });
    
    const finalMin = updates.minCapacity !== undefined ? updates.minCapacity : currentActivity.minCapacity;
    const finalMax = updates.maxCapacity !== undefined ? updates.maxCapacity : currentActivity.maxCapacity;
    if (finalMax !== null && finalMax < finalMin) {
      return res.status(400).json({ error: 'Max Capacity must be greater than or equal to Min Capacity' });
    }

    if (req.files && req.files.image && req.files.image[0]) {
      updates.images = [req.files.image[0].path];
    }

    if (req.files && req.files.mediaFiles) {
      if (!updates.mediaAlbum) updates.mediaAlbum = [...(currentActivity.mediaAlbum || [])];
      const newMedia = req.files.mediaFiles.map(file => ({
        url: file.path,
        mediaType: 'image',
        publicId: file.filename
      }));
      updates.mediaAlbum.push(...newMedia);
    }

    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    return res.json({ activity });
  } catch (err) {
    next(err);
  }
};

// ── Partial Update Activity (Admin) ──────────────────────────
export const patchActivity = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid Activity ID' });
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!activity)
      return res.status(404).json({ error: 'Activity not found' });
    return res.json({ activity });
  } catch (err) {
    next(err);
  }
};

// ── Soft-Delete Activity (Admin) ─────────────────────────────
export const deleteActivity = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid Activity ID' });
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!activity)
      return res.status(404).json({ error: 'Activity not found' });
    return res.json({ message: 'Activity deactivated', activity });
  } catch (err) {
    next(err);
  }
};

// ── Hard-Delete Activity (Admin) ─────────────────────────────
export const hardDeleteActivity = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid Activity ID' });
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity)
      return res.status(404).json({ error: 'Activity not found' });

    // Clean up related data
    await Booking.deleteMany({ activity: req.params.id });
    await Favorite.deleteMany({ activity: req.params.id });

    return res.json({ message: 'Activity permanently deleted' });
  } catch (err) {
    next(err);
  }
};



// ── Get All Activities (Admin — includes inactive) ───────────
export const adminListActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      Activity.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Activity.countDocuments(),
    ]);

    return res.json({
      activities,
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
