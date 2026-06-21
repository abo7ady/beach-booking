import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  hashedOtp: { type: String, required: true },
  attempts: { type: Number, default: 0 }, // Max 3 wrong guesses
  purpose: {
    type: String,
    enum: ['registration', 'reset'],
    required: true,
  },

  // ✅ MongoDB TTL index — document auto-deleted after 180 seconds
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180,
  },
});

// Scope OTP lookup per email + purpose
otpSchema.index({ email: 1, purpose: 1 });

export default mongoose.model('Otp', otpSchema);
