const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const sendEmail = require('../utils/email');

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

// Send test email
router.post('/test-email', auth, admin, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'Email address is required' });
  }
  try {
    await sendEmail({
      email,
      subject: 'WAVFD Scheduler — Test Email',
      message: 'This is a test email from the WAVFD Scheduler. If you received this, email is configured correctly!'
    });
    res.json({ msg: 'Test email sent successfully' });
  } catch (err) {
    console.error('Test email error:', err.message);
    res.status(500).json({ msg: `Failed to send test email: ${err.message}` });
  }
});

module.exports = router;
