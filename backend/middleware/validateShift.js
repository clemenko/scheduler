const validateShiftDates = (req, res, next) => {
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
        return res.status(400).json({ msg: 'Please provide a start and end time.' });
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ msg: 'Invalid date format.' });
    }

    if (startDate < now) {
        return res.status(400).json({ msg: 'Start time cannot be in the past.' });
    }

    if (startDate >= endDate) {
        return res.status(400).json({ msg: 'End time must be after start time.' });
    }
    next();
};

module.exports = validateShiftDates;
