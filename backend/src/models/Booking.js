import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  },
  { timestamps: true, _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
    desiredDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Confirmed', 'Cancelled'],
      default: 'New',
      index: true,
    },
    adminNote: { type: String, default: '' },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

// Admin queue: group by status, newest first
bookingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);
