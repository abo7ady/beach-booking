import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
    },
  },
  { timestamps: true }
);

// Ensures one user can favorite an activity exactly once
favoriteSchema.index({ user: 1, activity: 1 }, { unique: true });

export default mongoose.model('Favorite', favoriteSchema);
