import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import { sendSMS } from '../services/sms.service.js';

export const sendOtp = async (phone, purpose) => {
  // Rate limit: 1 OTP per 60s per phone per purpose
  const recent = await Otp.findOne({ phone, purpose });
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

  // Remove any existing OTP for this phone + purpose
  await Otp.findOneAndDelete({ phone, purpose });
  await Otp.create({ phone, hashedOtp, purpose });

  await sendSMS(phone, `Your Beach Booking code is: ${otp}. Valid for 3 minutes.`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[OTP][${purpose}] ${phone}: ${otp}`);
  }
};
