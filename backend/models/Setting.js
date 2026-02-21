const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  calendarTitle: {
    type: String,
    default: 'Fire Department Scheduler'
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  headerColor: {
    type: String,
    default: '#1976d2'
  },
  logoUrl: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Setting', SettingSchema);
