import crypto from 'crypto';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { signToken } from '../utils/signToken.js';
import { isValidEmail } from '../utils/validate.js';
import { sendOtp } from '../utils/sendOtp.js';
import { consumeOtp } from '../utils/consumeOtp.js';

// ── Registration — Send Email OTP ─────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { email, password, name, whatsappNumber } = req.body;

    // 1. Validate inputs
    if (!name || name.trim().length < 2)
      return res.status(400).json({ error: 'Name is required' });
    if (!email || !isValidEmail(email))
      return res.status(400).json({ error: 'Please enter a valid email address' });
    if (!password || password.length < 8)
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    if (!whatsappNumber || whatsappNumber.trim().length < 10)
      return res
        .status(400)
        .json({ error: 'Please enter a valid phone number' });

    // 2. Check email not already taken
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.isEmailVerified) {
        return res
          .status(400)
          .json({ error: 'Email already registered. Please log in.' });
      } else {
        // If they registered before but didn't verify, update their info
        existing.password = password;
        existing.name = name.trim();
        existing.whatsappNumber = whatsappNumber.trim();
        await existing.save();
      }
    } else {
      // Create unverified user
      await User.create({
        email: email.toLowerCase(),
        password,
        name: name.trim(),
        whatsappNumber: whatsappNumber.trim(),
        isEmailVerified: false,
      });
    }

    // 3. Send Email OTP
    await sendOtp(email.toLowerCase(), 'registration');

    return res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      return res.status(400).json({ error: message });
    }
    next(err);
  }
};

// ── Verify Registration OTP ──────────────────────────────────
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // 1. Verify OTP
    await consumeOtp(email.toLowerCase(), otp, 'registration');

    // 2. Mark user as verified
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Issue JWT
    const token = signToken(user);

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    // 4. Notify Admin
    await Notification.create({
      recipient: 'admin',
      title: 'New User Registration',
      message: `A new user (${email}) has registered.`,
      type: 'register',
      targetUrl: '/admin/users',
    });

    return res.status(200).json({ token, user: userObj });
  } catch (err) {
    next(err);
  }
};

// ── Login ────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user — explicitly select password
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user)
      return res
        .status(401)
        .json({ error: 'Invalid email or password' });

    // 2. Block unverified accounts
    if (!user.isEmailVerified)
      return res.status(403).json({
        error: 'Account not verified. Please verify your email first.',
      });

    // Block deactivated accounts
    if (user.isActive === false) {
      return res.status(403).json({
        error: 'This account has been deactivated. Please contact support.',
      });
    }

    // 3. Password check
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ error: 'Invalid email or password' });

    // 4. Issue JWT
    const token = signToken(user);

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    return res.json({ token, user: userObj });
  } catch (err) {
    next(err);
  }
};

// ── Forgot Password — Send Reset OTP ─────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase(), isEmailVerified: true });
    // Always return 200/success to prevent email enumeration attacks
    if (!user) return res.json({ success: true });

    // Send Reset OTP to email
    await sendOtp(email.toLowerCase(), 'reset');

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ── Verify Reset OTP ─────────────────────────────────────────
export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // 1. Verify OTP
    await consumeOtp(email?.toLowerCase(), otp, 'reset');

    // 2. Generate secure one-time password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await User.findOneAndUpdate(
      { email: email?.toLowerCase() },
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: Date.now() + 15 * 60 * 1000, // 15 mins
      }
    );

    return res.json({ success: true, resetToken });
  } catch (err) {
    next(err);
  }
};

// ── Reset Password — Use Reset Token ─────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8)
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });

    // Hash the incoming token and compare to what's stored
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      email: email?.toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user)
      return res
        .status(400)
        .json({ error: 'Reset token is invalid or has expired.' });

    if (user.isActive === false) {
      return res.status(403).json({
        error: 'This account has been deactivated. Please contact support.',
      });
    }

    // Update password and clear reset fields
    user.password = newPassword; // pre-save hook re-hashes
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Auto-login
    const token = signToken(user);

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({ token, user: userObj });
  } catch (err) {
    next(err);
  }
};
