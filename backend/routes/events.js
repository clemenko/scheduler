const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const sendEmail = require('../utils/email');
const User = require('../models/User');

const Schedule = require('../models/Schedule');

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('creator', 'name').lean();
    for (const event of events) {
      const signups = await Schedule.find({ event: event._id }).populate('user', 'name').populate('vehicle', 'name');
      event.signups = signups;
    }
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ... (rest of the file)

// Create an event
router.post('/', auth, async (req, res) => {
  const { title, start_time, end_time, max_slots } = req.body;
  try {
    const newEvent = new Event({
      title,
      start_time,
      end_time,
      max_slots,
      creator: req.user.id
    });
    const event = await newEvent.save();

    // Send email to all users
    const users = await User.find();
    const emailOptions = {
      subject: 'New Event Available for Signup',
      message: `A new event has been created: ${event.title}. It starts at ${event.start_time} and ends at ${event.end_time}.`
    };
    for (const user of users) {
      emailOptions.email = user.email;
      await sendEmail(emailOptions);
    }

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update an event
router.put('/:id', auth, async (req, res) => {
  const { title, start_time, end_time, max_slots } = req.body;
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    // Check if user is the creator or an admin
    if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    event.title = title;
    event.start_time = start_time;
    event.end_time = end_time;
    event.max_slots = max_slots;
    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete an event
router.delete('/:id', auth, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    // Check if user is the creator or an admin
    if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Event.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
