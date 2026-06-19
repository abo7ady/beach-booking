import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      // Can be a string 'admin' to broadcast to all admins, or an ObjectId referencing a User
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['register', 'booking_new', 'booking_status', 'system'],
      default: 'system',
    },
    targetUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
