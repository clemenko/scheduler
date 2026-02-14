const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  capacity: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
