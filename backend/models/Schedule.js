const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
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
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
