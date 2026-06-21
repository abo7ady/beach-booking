import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Never returned in queries by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      minlength: [10, 'Please enter a valid phone number'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
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
