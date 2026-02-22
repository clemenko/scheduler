import mongoose from 'mongoose';

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

export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
