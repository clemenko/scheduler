const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateShiftDates = require('../middleware/validateShift');
const sendEmail = require('../utils/email');
const User = require('../models/User');

const Schedule = require('../models/Schedule');

// Get all shifts (public — no details)
router.get('/public', async (req, res) => {
  try {
    const shifts = await Shift.find({}, 'title start_time end_time').lean();
    res.json(shifts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all shifts (authenticated — full details)
router.get('/', auth, async (req, res) => {
  try {
    const shifts = await Shift.find().populate('creator', 'name').lean();
    for (const shift of shifts) {
      if (shift.isRecurring && !shift.recurrenceRule) {
        shift.recurrenceRule = {
          frequency: shift.recurringType || 'daily',
          endType: 'on_date',
          endDate: shift.recurringEndDate || new Date()
        };
      }
      const signups = await Schedule.find({ shift: shift._id }).populate('user', 'name _id').populate('vehicle', 'name');
      shift.signups = signups;
    }
    res.json(shifts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

const { RRule } = require('rrule');

// Create a shift
router.post('/', auth, admin, async (req, res) => {
  const { title, start_time, end_time, isRecurring, recurrenceRule, exclusions = [] } = req.body;
  try {
    if (isRecurring) {
      const { frequency, daysOfWeek, dayOfMonth, endType, endDate, occurrences } = recurrenceRule;

      const rruleOptions = {
        freq: RRule[frequency.toUpperCase()],
        dtstart: new Date(start_time),
      };

      if (daysOfWeek && Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
        rruleOptions.byweekday = daysOfWeek.map(day => RRule[day.toUpperCase()]);
      }

      if (frequency === 'monthly' && dayOfMonth) {
        rruleOptions.bymonthday = dayOfMonth;
      }

      if (endType === 'on_date' && endDate) {
        rruleOptions.until = new Date(endDate);
      } else if (endType === 'after_occurrences' && occurrences) {
        rruleOptions.count = occurrences;
      } else {
        // 'never' — cap at one year of occurrences to prevent unbounded inserts
        rruleOptions.count = 365;
      }

      const rule = new RRule(rruleOptions);

      const shiftDuration = new Date(end_time).getTime() - new Date(start_time).getTime();
      const exclusionTimes = new Set(exclusions.map(ex => new Date(ex).getTime()));

      const createdShifts = rule.all().filter(date => {
        return !exclusionTimes.has(date.getTime());
      }).map(date => {
        const currentEndDate = new Date(date.getTime() + shiftDuration);
        return {
          title,
          start_time: date,
          end_time: currentEndDate,
          creator: req.user.id,
          isRecurring: true,
          recurrenceRule,
          exclusions
        };
      });

      if(createdShifts.length > 0) {
        const result = await Shift.insertMany(createdShifts);
        const parentId = result[0]._id;
        await Shift.updateMany({ _id: { $in: result.map(s => s._id) } }, { parentShift: parentId });
        res.json(result);
      } else {
        res.json([]);
      }

    } else {
      validateShiftDates(req, res, async () => {
        const newShift = new Shift({
          title,
          start_time,
          end_time,
          creator: req.user.id
        });
        const shift = await newShift.save();
        res.json(shift);
      });
    }

  } catch (err) {
    console.error('Error creating shift:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update a single shift
router.put('/:id', auth, admin, async (req, res) => {
    try {
        const { title, start_time, end_time } = req.body;
        let shift = await Shift.findById(req.params.id);

        if (!shift) {
            return res.status(404).json({ msg: 'Shift not found' });
        }
        if (shift.isRecurring) {
            return res.status(400).json({ msg: 'This is a recurring shift. Please update the entire series.' });
        }

        validateShiftDates(req, res, async () => {
            shift.title = title;
            shift.start_time = start_time;
            shift.end_time = end_time;
            await shift.save();
            res.json(shift);
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// Update a recurring shift series
router.put('/series/:id', auth, admin, async (req, res) => {
    const { title, start_time, end_time, recurrenceRule, exclusions = [] } = req.body;
    try {
      let parentShift = await Shift.findById(req.params.id);
      if (!parentShift) {
        return res.status(404).json({ msg: 'Shift series not found' });
      }
  
      // Delete old series
      await Shift.deleteMany({ $or: [{ _id: parentShift._id }, { parentShift: parentShift._id }] });
  
      // Create new series
      const { frequency, daysOfWeek, dayOfMonth, endType, endDate, occurrences } = recurrenceRule;
      const rruleOptions = {
        freq: RRule[frequency.toUpperCase()],
        dtstart: new Date(start_time),
      };
      if (daysOfWeek && Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
        rruleOptions.byweekday = daysOfWeek.map(day => RRule[day.toUpperCase()]);
      }
      if (frequency === 'monthly' && dayOfMonth) {
        rruleOptions.bymonthday = dayOfMonth;
      }
      if (endType === 'on_date' && endDate) {
        rruleOptions.until = new Date(endDate);
      } else if (endType === 'after_occurrences' && occurrences) {
        rruleOptions.count = occurrences;
      } else {
        // 'never' — cap at one year of occurrences to prevent unbounded inserts
        rruleOptions.count = 365;
      }

      const rule = new RRule(rruleOptions);
      const shiftDuration = new Date(end_time).getTime() - new Date(start_time).getTime();
      const exclusionTimes = new Set(exclusions.map(ex => new Date(ex).getTime()));
  
      const createdShifts = rule.all().filter(date => {
        return !exclusionTimes.has(date.getTime());
        }).map(date => {
        const currentEndDate = new Date(date.getTime() + shiftDuration);
        return {
          title,
          start_time: date,
          end_time: currentEndDate,
          creator: req.user.id,
          isRecurring: true,
          recurrenceRule,
          exclusions
        };
      });
  
      if (createdShifts.length > 0) {
        const result = await Shift.insertMany(createdShifts);
        const newParentId = result[0]._id;
        await Shift.updateMany({ _id: { $in: result.map(s => s._id) } }, { parentShift: newParentId });
        const newShifts = await Shift.find({ _id: { $in: result.map(s => s._id) } }).lean();
        res.json(newShifts);
      } else {
        res.json([]);
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

// Delete a shift
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    let shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ msg: 'Shift not found' });
    }

    if (shift.isRecurring) {
        return res.status(400).json({ msg: 'This is a recurring shift. Please delete the entire series.' });
    }

    await Shift.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Shift removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a recurring shift series
router.delete('/series/:id', auth, admin, async (req, res) => {
    try {
      let shift = await Shift.findById(req.params.id);
      if (!shift) {
        return res.status(404).json({ msg: 'Shift series not found' });
      }

      const parentId = shift.parentShift || shift._id;
      let parentShift = await Shift.findById(parentId);

      if (parentShift) { // If we found a valid parent
        await Shift.deleteMany({ $or: [{ _id: parentId }, { parentShift: parentId }] });
      } else { // If parent is not found (dangling reference)
        await Shift.deleteMany({ $or: [{ _id: req.params.id }, { parentShift: parentId }] });
      }
  
      res.json({ msg: 'Shift series removed' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
});

module.exports = router;
