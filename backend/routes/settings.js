const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get settings
router.get('/', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      const defaultTitle = process.env.CALENDAR_TITLE || 'Fire Department Scheduler';
      settings = new Setting({ calendarTitle: defaultTitle });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update settings
router.put('/', auth, admin, async (req, res) => {
  const { calendarTitle, allowRegistration, headerColor, logoUrl } = req.body;
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }
    settings.calendarTitle = calendarTitle;
    if (typeof allowRegistration === 'boolean') {
      settings.allowRegistration = allowRegistration;
    }
    if (headerColor) {
      settings.headerColor = headerColor;
    }
    if (typeof logoUrl === 'string') {
      settings.logoUrl = logoUrl;
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
