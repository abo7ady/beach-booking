import crypto from 'crypto';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { signToken } from '../utils/signToken.js';
import { sendOtp } from '../utils/sendOtp.js';
import { consumeOtp } from '../utils/consumeOtp.js';
import { isValidPhone } from '../utils/validatePhone.js';

// ── Registration — Step 1: Create account + send OTP ──────────
export const register = async (req, res, next) => {
  try {
    const { phone, password, name } = req.body;

    // 1. Validate inputs
    if (!isValidPhone(phone))
      return res.status(400).json({ error: 'Invalid phone number format' });
    if (!password || password.length < 8)
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });

    // 2. Check phone not already taken by a verified account
    const existing = await User.findOne({ phone });
    if (existing?.isPhoneVerified)
      return res
        .status(409)
        .json({ error: 'Phone number already registered. Please log in.' });

    // 3. Create user (or overwrite a stale unverified account)
    if (existing && !existing.isPhoneVerified) {
      existing.password = password; // will be re-hashed by pre-save hook
      existing.name = name || existing.name;
      await existing.save();
    } else {
      await User.create({ phone, password, name: name || '' });
    }

    // 4. Send OTP
    await sendOtp(phone, 'registration');

    // 5. Notify Admin
    await Notification.create({
      recipient: 'admin',
      title: 'New User Registration',
      message: `A new user (${phone}) has registered.`,
      type: 'register',
      targetUrl: '/admin/users',
    });

    return res.status(201).json({ success: true, expiresIn: 180 });
  } catch (err) {
    next(err);
  }
};

// ── Registration — Step 2: Verify OTP → activate account ──────
export const verifyRegistration = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // 1. Verify OTP (purpose: 'registration')
    await consumeOtp(phone, otp, 'registration');

    // 2. Activate account
    const user = await User.findOneAndUpdate(
      { phone },
      { isPhoneVerified: true },
      { new: true }
    );

    // 3. Issue JWT
    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

// ── Login — Direct (No OTP) ──────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // 1. Find user — explicitly select password
    const user = await User.findOne({ phone }).select('+password');
    if (!user)
      return res
        .status(401)
        .json({ error: 'Invalid phone number or password' });

    // 2. Block unverified accounts
    if (!user.isPhoneVerified)
      return res.status(403).json({
        error: 'Phone not verified. Please complete registration.',
        action: 'verify_registration',
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
        .json({ error: 'Invalid phone number or password' });

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

// ── Forgot Password — Send reset OTP ─────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone, isPhoneVerified: true });
    // Always return 200 to prevent phone enumeration attacks
    if (!user) return res.json({ success: true, expiresIn: 180 });

    await sendOtp(phone, 'reset');
    return res.json({ success: true, expiresIn: 180 });
  } catch (err) {
    next(err);
  }
};

// ── Verify Reset OTP → generate reset token ──────────────────
export const verifyResetOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    await consumeOtp(phone, otp, 'reset');

    // Generate a 32-byte random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await User.findOneAndUpdate(
      { phone },
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
      }
    );

    return res.json({ resetToken });
  } catch (err) {
    next(err);
  }
};

// ── Reset Password — use reset token ─────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { phone, resetToken, newPassword } = req.body;

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
      phone,
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

