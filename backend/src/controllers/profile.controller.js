import User from '../models/User.js';

// ── Get Profile ──────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
};

// ── Update Profile ───────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, whatsappNumber, telegram, instagram, snapchat, messenger, preferredContact } = req.body;

    // Validate inputs
    if (name !== undefined && (!name || name.trim().length < 2)) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (whatsappNumber !== undefined && (!whatsappNumber || whatsappNumber.trim().length < 10)) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber.trim();
    if (telegram !== undefined) updates.telegram = telegram;
    if (instagram !== undefined) updates.instagram = instagram;
    if (snapchat !== undefined) updates.snapchat = snapchat;
    if (messenger !== undefined) updates.messenger = messenger;
    if (preferredContact !== undefined) updates.preferredContact = preferredContact;
    if (req.file) {
      updates.profilePicture = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user, message: 'Profile updated successfully' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      return res.status(400).json({ error: message });
    }
    next(err);
  }
};
