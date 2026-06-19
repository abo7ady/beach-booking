import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Never returned in queries by default
    },
    name: { type: String, trim: true, default: '' },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isPhoneVerified: {
      type: Boolean,
      default: false, // Set to true after OTP verification at registration
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ── Alternative contact handles (stored without @ or +)
    telegram: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    snapchat: { type: String, trim: true, default: '' },
    messenger: { type: String, trim: true, default: '' },

    preferredContact: {
      type: String,
      enum: ['whatsapp', 'telegram', 'instagram', 'snapchat', 'messenger'],
      default: 'whatsapp',
    },

    // ── Password reset fields
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Instance method for login comparison
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
