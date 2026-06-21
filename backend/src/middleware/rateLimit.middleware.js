import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  validate: { default: false }, // Express 5 compatibility
  skip: (req) => req.method === 'OPTIONS', // Don't count CORS preflight
});

// OTP rate limiter — stricter
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.body.email || req.body.phone || req.ip,
  validate: { default: false },
  message: { error: 'Too many OTP requests. Please try again later.' },
  skip: (req) => req.method === 'OPTIONS',
});

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Too many login attempts. Please try again later.' },
  validate: { default: false }, // Express 5 compatibility
  skip: (req) => req.method === 'OPTIONS', // Don't count CORS preflight
});
