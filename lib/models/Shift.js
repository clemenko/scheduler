import mongoose from 'mongoose';

const RecurrenceRuleSchema = new mongoose.Schema({
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  interval: {
    type: Number,
    default: 1
  },
  daysOfWeek: {
    type: [String]
  },
  dayOfMonth: {
    type: Number
  },
  endType: {
    type: String,
    enum: ['never', 'on_date', 'after_occurrences'],
    required: true
  },
  endDate: {
    type: Date
  },
  occurrences: {
    type: Number
  }
});

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
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceRule: RecurrenceRuleSchema,
  exclusions: {
    type: [Date],
    default: []
  },
  parentShift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    default: null
  }
});

ShiftSchema.index({ start_time: 1 });

export default mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
