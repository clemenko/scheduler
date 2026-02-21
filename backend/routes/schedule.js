const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Shift = require('../models/Shift');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const sendEmail = require('../utils/email');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get my upcoming shifts
router.get('/my-shifts', auth, async (req, res) => {
  try {
    const range = req.query.range || 'week';
    const now = new Date();
    const end = new Date(now);
    if (range === 'month') {
      end.setDate(end.getDate() + 30);
    } else {
      end.setDate(end.getDate() + 7);
    }

    const upcomingShifts = await Shift.find({
      start_time: { $gte: now, $lte: end }
    }).select('_id').lean();

    const shiftIds = upcomingShifts.map(s => s._id);

    const mySignups = await Schedule.find({
      user: req.user.id,
      shift: { $in: shiftIds }
    })
      .populate('shift', 'title start_time end_time')
      .populate('vehicle', 'name')
      .lean();

    mySignups.sort((a, b) => new Date(a.shift?.start_time) - new Date(b.shift?.start_time));

    res.json(mySignups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Sign up for a shift (regular and admin only)
router.post('/signup', auth, async (req, res) => {
  if (req.user.role === 'viewer') {
    return res.status(403).json({ msg: 'Viewers cannot sign up for shifts' });
  }
  const { shiftId, vehicleId } = req.body;
  if (!isValidId(shiftId) || !isValidId(vehicleId)) {
    return res.status(400).json({ msg: 'Invalid shift or vehicle ID' });
  }
  try {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ msg: 'Shift not found' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }

    const signups = await Schedule.find({ shift: shiftId, vehicle: vehicleId });
    if (signups.length >= vehicle.capacity) {
      return res.status(400).json({ msg: 'This vehicle is full for this shift' });
    }

    // Check if user is already signed up
    const existingSignup = await Schedule.findOne({ shift: shiftId, user: req.user.id });
    if (existingSignup) {
      return res.status(400).json({ msg: 'User already signed up for this shift' });
    }

    const newSignup = new Schedule({
      shift: shiftId,
      user: req.user.id,
      vehicle: vehicleId
    });

    const signup = await newSignup.save();

    const actingUser = await User.findById(req.user.id);
    await new AuditLog({
      action: 'signup',
      performedBy: req.user.id,
      targetUser: req.user.id,
      shift: shiftId,
      vehicle: vehicleId,
      userName: actingUser?.name,
      shiftTitle: shift.title,
      shiftStart: shift.start_time,
      vehicleName: vehicle.name
    }).save();

    res.json(signup);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Cancel a signup
router.delete('/:signupId', auth, async (req, res) => {
  if (!isValidId(req.params.signupId)) {
    return res.status(400).json({ msg: 'Invalid signup ID' });
  }
  try {
    const signup = await Schedule.findById(req.params.signupId)
      .populate('user', 'name')
      .populate('shift', 'title start_time')
      .populate('vehicle', 'name');
    if (!signup) {
      return res.status(404).json({ msg: 'Signup not found' });
    }

    // Check if user is the creator or an admin
    if (signup.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Schedule.deleteOne({ _id: req.params.signupId });

    await new AuditLog({
      action: 'cancel',
      performedBy: req.user.id,
      targetUser: signup.user?._id,
      shift: signup.shift?._id,
      vehicle: signup.vehicle?._id,
      userName: signup.user?.name,
      shiftTitle: signup.shift?.title,
      shiftStart: signup.shift?.start_time,
      vehicleName: signup.vehicle?.name
    }).save();

    res.json({ msg: 'Signup canceled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Send reminders
router.post('/send-reminders', auth, admin, async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingShifts = await Shift.find({ start_time: { $gte: now, $lte: twentyFourHoursFromNow } });
    const shiftIds = upcomingShifts.map(s => s._id);
    const schedules = await Schedule.find({ shift: { $in: shiftIds }, reminderSent: { $ne: true } }).populate('shift user');

    for (const schedule of schedules) {
      const emailOptions = {
        email: schedule.user.email,
        subject: 'Shift Reminder',
        message: `This is a reminder that you are signed up for the shift: ${schedule.shift.title}. It starts at ${schedule.shift.start_time}.`
      };
      await sendEmail(emailOptions);
      schedule.reminderSent = true;
      await schedule.save();
    }

    res.json({ msg: 'Reminders sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
