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
    const { name, telegram, instagram, snapchat, messenger, preferredContact } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (telegram !== undefined) updates.telegram = telegram;
    if (instagram !== undefined) updates.instagram = instagram;
    if (snapchat !== undefined) updates.snapchat = snapchat;
    if (messenger !== undefined) updates.messenger = messenger;
    if (preferredContact !== undefined) updates.preferredContact = preferredContact;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};
