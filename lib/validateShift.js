export default function validateShiftDates(start_time, end_time) {
  if (!start_time || !end_time) {
    return 'Please provide a start and end time.';
  }

  const startDate = new Date(start_time);
  const endDate = new Date(end_time);
  const now = new Date();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'Invalid date format.';
  }

  if (startDate < now) {
    return 'Start time cannot be in the past.';
  }

  if (startDate >= endDate) {
    return 'End time must be after start time.';
  }

  return null;
}
