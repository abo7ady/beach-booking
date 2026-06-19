import User from '../models/User.js';

export const getAllUsers = async (req, res, next) => {
  try {
    let users = await User.find().select('-password').sort({ createdAt: -1 });
    users = users.map((u) => {
      const obj = u.toObject();
      obj.isActive = obj.isActive !== false; // default to true for old records
      return obj;
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Guardrail: Prevent admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(403).json({ error: 'You cannot deactivate your own admin account.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = user.isActive === false ? true : false;
    await user.save();

    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (err) {
    next(err);
  }
};
