import nodemailer from 'nodemailer';

// Lazy-init transporter — env vars may not be loaded at import time (dotenvx timing)
let transporter = null;

function getTransporter() {
  if (!transporter) {
    console.log('[EMAIL INIT] Creating SMTP transporter...');
    console.log('[EMAIL INIT] EMAIL_USER:', process.env.EMAIL_USER || '⚠️ NOT SET');
    console.log('[EMAIL INIT] EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (hidden)' : '⚠️ NOT SET');

    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

export const sendEmailOTP = async (to, code) => {
  console.log(`[EMAIL] Attempting to send OTP email to: ${to}`);
  console.log(`[EMAIL] OTP code: ${code}`);
  console.log(`[EMAIL] From: ${process.env.EMAIL_USER}`);

  const mailOptions = {
    from: `"BeachBooking" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your BeachBooking Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600;">Verify Your Email Address</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Please use the following 6-digit verification code to complete your registration or password reset at BeachBooking:</p>
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">This code is valid for 3 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('[EMAIL] ✅ Email sent successfully!');
    console.log('[EMAIL] Message ID:', info.messageId);
    console.log('[EMAIL] Response:', info.response);
    return info;
  } catch (error) {
    console.error('[EMAIL] ❌ Nodemailer Error:', error.message);
    console.error('[EMAIL] Error code:', error.code);
    console.error('[EMAIL] Full error:', error);
    // Always throw so the caller can return a proper error to the user
    throw error;
  }
};
