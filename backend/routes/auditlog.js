const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all audit logs
router.get('/', auth, admin, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .populate('performedBy', 'name')
      .populate('targetUser', 'name')
      .lean();
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Export audit logs as CSV
router.get('/export', auth, admin, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .populate('performedBy', 'name')
      .populate('targetUser', 'name')
      .lean();

    const header = 'Timestamp,Action,User,Shift,Shift Start,Vehicle,Performed By';
    const rows = logs.map(log => {
      const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : '';
      const action = log.action || '';
      const user = (log.targetUser?.name || log.userName || '').replace(/,/g, ' ');
      const shift = (log.shiftTitle || '').replace(/,/g, ' ');
      const shiftStart = log.shiftStart ? new Date(log.shiftStart).toISOString() : '';
      const vehicle = (log.vehicleName || '').replace(/,/g, ' ');
      const performedBy = (log.performedBy?.name || '').replace(/,/g, ' ');
      return `${timestamp},${action},${user},${shift},${shiftStart},${vehicle},${performedBy}`;
    });

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
