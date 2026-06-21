export const isValidPhone = (phone) => {
  // Accept Egyptian phone numbers: +201xxxxxxxxx or 01xxxxxxxxx
  const phoneRegex = /^(\+?20)?1[0-9]{9}$/;
  return phoneRegex.test(phone?.replace(/\s/g, ''));
};

export const normalizePhone = (phone) => {
  // Remove spaces and normalize to +20 format
  let cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('01')) {
    cleaned = '+20' + cleaned.slice(1);
  } else if (cleaned.startsWith('201')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+20')) {
    cleaned = '+20' + cleaned;
  }
  return cleaned;
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
