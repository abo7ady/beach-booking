import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import { sendEmailOTP } from './email.js';

export const sendOtp = async (email, purpose) => {
  // Rate limit: 1 OTP per 60s per email per purpose
  const recent = await Otp.findOne({ email, purpose });
  if (recent) {
    const elapsed = (Date.now() - recent.createdAt) / 1000;
    if (elapsed < 60) {
      const err = new Error('Please wait before requesting a new code');
      err.status = 429;
      err.retryAfter = Math.ceil(60 - elapsed);
      throw err;
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Remove any existing OTP for this email + purpose
  await Otp.findOneAndDelete({ email, purpose });
  await Otp.create({ email, hashedOtp, purpose });

  // Send the email — let errors propagate with a friendly message
  try {
    await sendEmailOTP(email, otp);
    console.log(`[OTP] ✅ OTP sent for ${purpose} to ${email}`);
  } catch (emailErr) {
    console.error(`[OTP] ❌ Failed to send OTP email for ${purpose} to ${email}:`, emailErr.message);
    const err = new Error('Failed to send verification email. Please try again later.');
    err.status = 500;
    throw err;
  }
};

