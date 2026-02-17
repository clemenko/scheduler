const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  max_slots: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Shift', ShiftSchema);
