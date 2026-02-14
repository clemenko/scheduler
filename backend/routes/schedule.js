const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/email');

// Sign up for an event
router.post('/signup', auth, async (req, res) => {
  const { eventId, vehicleId } = req.body;
  try {
    // Check if event is full
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    const signups = await Schedule.find({ event: eventId });
    if (signups.length >= event.max_slots) {
      return res.status(400).json({ msg: 'Event is full' });
    }

    // Check if user is already signed up
    const existingSignup = await Schedule.findOne({ event: eventId, user: req.user.id });
    if (existingSignup) {
      return res.status(400).json({ msg: 'User already signed up for this event' });
    }

    const newSignup = new Schedule({
      event: eventId,
      user: req.user.id,
      vehicle: vehicleId
    });

    const signup = await newSignup.save();
    res.json(signup);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Cancel a signup
router.delete('/:signupId', auth, async (req, res) => {
  try {
    const signup = await Schedule.findById(req.params.signupId);
    if (!signup) {
      return res.status(404).json({ msg: 'Signup not found' });
    }

    // Check if user is the creator or an admin
    if (signup.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Schedule.deleteOne({ _id: req.params.signupId });
    res.json({ msg: 'Signup canceled' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ... (existing code)

// Send reminders
router.post('/send-reminders', async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const schedules = await Schedule.find({ 'event.start_time': { $gte: now, $lte: twentyFourHoursFromNow }, reminderSent: { $ne: true } }).populate('event user');

    for (const schedule of schedules) {
      const emailOptions = {
        email: schedule.user.email,
        subject: 'Event Reminder',
        message: `This is a reminder that you are signed up for the event: ${schedule.event.title}. It starts at ${schedule.event.start_time}.`
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
