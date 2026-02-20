const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Helper to get month date range
const getMonthRange = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
};

// Get monthly report data
router.get('/monthly', auth, admin, async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ msg: 'Valid year and month (1-12) are required' });
    }

    const { start, end } = getMonthRange(year, month);

    const shifts = await Shift.find({
      start_time: { $gte: start, $lt: end }
    }).populate('creator', 'name').lean();

    const shiftIds = shifts.map(s => s._id);

    const signups = await Schedule.find({ shift: { $in: shiftIds } })
      .populate('user', 'name')
      .populate('vehicle', 'name')
      .populate('shift', 'title start_time end_time')
      .lean();

    // Aggregate vehicle usage
    const vehicleMap = {};
    for (const signup of signups) {
      const name = signup.vehicle?.name || 'Unknown';
      vehicleMap[name] = (vehicleMap[name] || 0) + 1;
    }
    const vehicleUsage = Object.entries(vehicleMap).map(([vehicleName, count]) => ({
      vehicleName,
      count
    }));

    res.json({
      totalShifts: shifts.length,
      totalSignups: signups.length,
      vehicleUsage,
      signups: signups.map(s => ({
        shiftTitle: s.shift?.title,
        shiftStart: s.shift?.start_time,
        shiftEnd: s.shift?.end_time,
        userName: s.user?.name,
        vehicleName: s.vehicle?.name
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Export monthly report as CSV
router.get('/monthly/export', auth, admin, async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ msg: 'Valid year and month (1-12) are required' });
    }

    const { start, end } = getMonthRange(year, month);

    const shifts = await Shift.find({
      start_time: { $gte: start, $lt: end }
    }).lean();

    const shiftIds = shifts.map(s => s._id);

    const signups = await Schedule.find({ shift: { $in: shiftIds } })
      .populate('user', 'name')
      .populate('vehicle', 'name')
      .populate('shift', 'title start_time end_time')
      .lean();

    const header = 'Shift Title,Shift Start,Shift End,User,Vehicle';
    const rows = signups.map(s => {
      const title = (s.shift?.title || '').replace(/,/g, ' ');
      const shiftStart = s.shift?.start_time ? new Date(s.shift.start_time).toISOString() : '';
      const shiftEnd = s.shift?.end_time ? new Date(s.shift.end_time).toISOString() : '';
      const user = (s.user?.name || '').replace(/,/g, ' ');
      const vehicle = (s.vehicle?.name || '').replace(/,/g, ' ');
      return `${title},${shiftStart},${shiftEnd},${user},${vehicle}`;
    });

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${year}-${String(month).padStart(2, '0')}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
