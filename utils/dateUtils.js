export const fromNaiveUTC = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};

export const toNaiveUTC = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return new Date(Date.UTC(
    d.getFullYear(), d.getMonth(), d.getDate(),
    d.getHours(), d.getMinutes(), d.getSeconds()
  ));
};

// Canonical display format for shift times across the entire app (UI + emails).
// Shift times are stored as "naive UTC" — the ET wall-clock numbers are parked
// in UTC fields — so we always read them back with timeZone: 'UTC' and label ET.
// Example: "Mon, Apr 7, 8:00 AM ET"
const SHIFT_TIME_FMT = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC'
};

export const formatShiftTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', SHIFT_TIME_FMT) + ' ET';
};

// For timestamps that ARE real UTC instants (e.g. audit log timestamps), not
// naive-UTC. Rendered in the viewer's local time zone with the same shape.
export const formatInstant = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};
