import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';

export const consumeOtp = async (email, otp, purpose) => {
  const record = await Otp.findOne({ email, purpose });
  if (!record) {
    const err = new Error('Code expired. Please request a new one.');
    err.status = 400;
    throw err;
  }

  record.attempts += 1;
  await record.save();

  if (record.attempts > 3) {
    await record.deleteOne();
    const err = new Error('Too many attempts. Request a new code.');
    err.status = 400;
    throw err;
  }

  const isValid = await bcrypt.compare(otp, record.hashedOtp);
  if (!isValid) {
    const err = new Error('Invalid code.');
    err.status = 400;
    err.attemptsLeft = 3 - record.attempts;
    throw err;
  }

  await record.deleteOne(); // Consumed — single use
};
