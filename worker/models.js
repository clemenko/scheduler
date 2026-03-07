const mongoose = require('mongoose');

const RecurrenceRuleSchema = new mongoose.Schema({
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], required: true },
  interval: { type: Number, default: 1 },
  daysOfWeek: { type: [String] },
  dayOfMonth: { type: Number },
  endType: { type: String, enum: ['never', 'on_date', 'after_occurrences'], required: true },
  endDate: { type: Date },
  occurrences: { type: Number }
});

const ShiftSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  isRecurring: { type: Boolean, default: false },
  recurrenceRule: RecurrenceRuleSchema,
  exclusions: { type: [Date], default: [] },
  parentShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', default: null }
});
ShiftSchema.index({ start_time: 1 });
ShiftSchema.index({ start_time: 1, end_time: 1 });

const ScheduleSchema = new mongoose.Schema({
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });
ScheduleSchema.index({ shift: 1, user: 1 }, { unique: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['viewer', 'regular', 'admin'], default: 'regular' }
});

const VehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  capacity: { type: Number, required: true }
});

module.exports = {
  Shift: mongoose.models.Shift || mongoose.model('Shift', ShiftSchema),
  Schedule: mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema),
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Vehicle: mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema),
};
