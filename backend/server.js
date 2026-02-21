require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const cron = require('node-cron');
const sendEmail = require('./utils/email');
const Shift = require('./models/Shift');
const Schedule = require('./models/Schedule');

const app = express();
const port = 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: { msg: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auditlog', require('./routes/auditlog'));
app.use('/api/reports', require('./routes/reports'));

mongoose.connect('mongodb://wavfd_sched_mongo:27017/scheduler', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');

    // Weekly reminder cron — Sunday 8 PM
    cron.schedule('0 20 * * 0', async () => {
      console.log('Running weekly shift reminder...');
      try {
        const now = new Date();
        const nextSunday = new Date(now);
        nextSunday.setDate(now.getDate() + 7);

        const upcomingShifts = await Shift.find({
          start_time: { $gte: now, $lte: nextSunday }
        });
        const shiftIds = upcomingShifts.map(s => s._id);

        const schedules = await Schedule.find({ shift: { $in: shiftIds } })
          .populate('shift user vehicle');

        // Group by user
        const byUser = {};
        for (const s of schedules) {
          if (!s.user || !s.user.email) continue;
          const uid = s.user._id.toString();
          if (!byUser[uid]) byUser[uid] = { user: s.user, shifts: [] };
          byUser[uid].shifts.push(s);
        }

        for (const { user, shifts } of Object.values(byUser)) {
          const lines = shifts.map(s => {
            const date = new Date(s.shift.start_time).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
            });
            const vehicle = s.vehicle ? ` — ${s.vehicle.name}` : '';
            return `  • ${s.shift.title} on ${date}${vehicle}`;
          });

          await sendEmail({
            email: user.email,
            subject: 'Your Upcoming Shifts This Week',
            message: `Hi ${user.name},\n\nHere are your shifts for the upcoming week:\n\n${lines.join('\n')}\n\nThanks!`
          });
        }

        console.log(`Weekly reminders sent to ${Object.keys(byUser).length} user(s)`);
      } catch (err) {
        console.error('Weekly reminder error:', err.message);
      }
    });
    console.log('Weekly reminder cron scheduled (Sunday 8 PM)');

    // Daily shift reminder cron — 6 AM every day
    cron.schedule('0 6 * * *', async () => {
      console.log('Running daily shift reminder...');
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysShifts = await Shift.find({
          start_time: { $gte: startOfDay, $lte: endOfDay }
        });
        const shiftIds = todaysShifts.map(s => s._id);

        const schedules = await Schedule.find({
          shift: { $in: shiftIds },
          reminderSent: { $ne: true }
        }).populate('shift user vehicle');

        for (const schedule of schedules) {
          if (!schedule.user || !schedule.user.email) continue;
          const startTime = new Date(schedule.shift.start_time).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit'
          });
          const vehicle = schedule.vehicle ? ` on ${schedule.vehicle.name}` : '';
          await sendEmail({
            email: schedule.user.email,
            subject: 'Shift Reminder — Today',
            message: `Hi ${schedule.user.name},\n\nReminder: you have a shift today.\n\n  • ${schedule.shift.title} at ${startTime}${vehicle}\n\nThanks!`
          });
          schedule.reminderSent = true;
          await schedule.save();
        }

        console.log(`Daily reminders sent for ${schedules.length} schedule(s)`);
      } catch (err) {
        console.error('Daily reminder error:', err.message);
      }
    });
    console.log('Daily shift reminder cron scheduled (6 AM)');

    app.listen(port, () => {
      console.log(`Backend listening at http://localhost:${port}`);
    });
  })
  .catch(err => console.log(err));
