import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [{ type: String }], // Cloudinary secure URLs
    durationMinutes: { type: Number, default: 60 },
    tags: [{ type: String }], // e.g. ['ATV', 'Parachute']

    // ── Popularity system
    popularityScore: {
      type: Number,
      default: 0,
      index: true, // Fast DESC sort on catalog
    },
    isTrending: { type: Boolean, default: false }, // Computed + persisted

    isActive: { type: Boolean, default: true }, // Soft-delete flag
  },
  { timestamps: true }
);

// Catalog query: active activities sorted by score
activitySchema.index({ isActive: 1, popularityScore: -1 });

export default mongoose.model('Activity', activitySchema);
