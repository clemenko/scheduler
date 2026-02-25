const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://wavfd_sched_mongo:27017/scheduler';

// Inline models (worker runs as standalone Node process)
const ShiftSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  isRecurring: { type: Boolean, default: false },
  recurrenceRule: mongoose.Schema.Types.Mixed,
  exclusions: { type: [Date], default: [] },
  parentShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null }
});
ShiftSchema.index({ start_time: 1 });
const Shift = mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);

const ScheduleSchema = new mongoose.Schema({
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });
const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['viewer', 'regular', 'admin'], default: 'regular' }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const VehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  capacity: { type: Number, required: true }
});
const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

// Email setup
let transporter = null;
if (process.env.SMTP_HOST) {
  const port = parseInt(process.env.SMTP_PORT || '587');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' }
  });
} else if (process.env.GMAIL_USER) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  });
}

async function sendEmail(options) {
  if (!transporter) {
    console.log('Email not configured — logging instead');
    console.log('To:', options.email, 'Subject:', options.subject);
    return;
  }
  const from = process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@wavfd.org';
  await transporter.sendMail({ from, to: options.email, subject: options.subject, text: options.message });
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Worker: MongoDB connected');

    // Weekly reminder cron — Sunday 8 PM ET
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
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC'
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
    }, { timezone: 'America/New_York' });
    console.log('Weekly reminder cron scheduled (Sunday 8 PM ET)');

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
            hour: 'numeric', minute: '2-digit', timeZone: 'UTC'
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
    }, { timezone: 'America/New_York' });
    console.log('Daily shift reminder cron scheduled (6 AM ET)');

    console.log('Worker is running...');
  })
  .catch(err => console.error('Worker MongoDB connection error:', err));
