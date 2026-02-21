const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const bcrypt = require('bcryptjs');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all users
router.get('/', auth, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset user password
router.put('/:id/reset-password', auth, admin, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid user ID' });
  }
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ msg: 'Password must be at least 8 characters' });
  }
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user role
router.put('/:id/role', auth, admin, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid user ID' });
  }
  const { role } = req.body;

  // Validate role
  if (!['admin', 'regular', 'viewer'].includes(role)) {
    return res.status(400).json({ msg: 'Invalid role' });
  }

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // To prevent the last admin from being demoted, check if there is at least one other admin.
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ msg: 'Cannot remove the last admin' });
      }
    }

    user.role = role;
    await user.save();

    const userToReturn = user.toObject();
    delete userToReturn.password;

    res.json(userToReturn);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete user
router.delete('/:id', auth, admin, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid user ID' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ msg: 'Cannot delete an admin user' });
    }

    await User.deleteOne({ _id: req.params.id });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
