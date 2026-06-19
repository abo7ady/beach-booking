// SMS Service — abstraction layer
// In development, logs to console. In production, uses Twilio.

export const sendSMS = async (phone, message) => {
  if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS] To: ${phone} | Message: ${message}`);
    return { success: true, provider: 'console' };
  }

  try {
    // Lazy-load twilio only in production
    const twilio = (await import('twilio')).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER,
      to: phone,
    });

    return { success: true, provider: 'twilio', sid: result.sid };
  } catch (error) {
    console.error('[SMS] Failed to send:', error.message);
    throw new Error('Failed to send SMS. Please try again later.');
  }
};
