const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

ScheduleSchema.index({ shift: 1, user: 1 });
ScheduleSchema.index({ user: 1 });
ScheduleSchema.index({ shift: 1, vehicle: 1 });

module.exports = mongoose.model('Schedule', ScheduleSchema);
