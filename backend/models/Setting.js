const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  calendarTitle: {
    type: String,
    default: 'Fire Department Scheduler'
  },
  allowRegistration: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Setting', SettingSchema);
