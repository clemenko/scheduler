const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateShiftDates = require('../middleware/validateShift');
const sendEmail = require('../utils/email');
const User = require('../models/User');

const Schedule = require('../models/Schedule');

// Get all shifts
router.get('/', async (req, res) => {
  try {
    const shifts = await Shift.find().populate('creator', 'name').lean();
    for (const shift of shifts) {
      const signups = await Schedule.find({ shift: shift._id }).populate('user', 'name _id').populate('vehicle', 'name');
      shift.signups = signups;
    }
    res.json(shifts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a shift
router.post('/', [auth, validateShiftDates], async (req, res) => {
  const { title, start_time, end_time, max_slots } = req.body;
  try {
    const newShift = new Shift({
      title,
      start_time,
      end_time,
      max_slots,
      creator: req.user.id
    });
    const shift = await newShift.save();

    // Send email to all users
    const users = await User.find();
    const emailOptions = {
      subject: 'New Shift Available for Signup',
      message: `A new shift has been created: ${shift.title}. It starts at ${shift.start_time} and ends at ${shift.end_time}.`
    };
    for (const user of users) {
      emailOptions.email = user.email;
      await sendEmail(emailOptions);
    }

    res.json(shift);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a shift
router.put('/:id', [auth, validateShiftDates], async (req, res) => {
  const { title, start_time, end_time, max_slots } = req.body;
  try {
    let shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ msg: 'Shift not found' });
    }
    // Check if user is the creator or an admin
    if (shift.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    shift.title = title;
    shift.start_time = start_time;
    shift.end_time = end_time;
    shift.max_slots = max_slots;
    await shift.save();
    res.json(shift);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a shift
router.delete('/:id', auth, async (req, res) => {
  try {
    let shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ msg: 'Shift not found' });
    }
    // Check if user is the creator or an admin
    if (shift.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Shift.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Shift removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
