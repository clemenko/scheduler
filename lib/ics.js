import crypto from 'crypto';

const TIMEZONE = 'America/New_York';

// Format a naive-UTC date as local EST/EDT time (no Z suffix)
function formatDateLocal(date) {
  const d = new Date(date);
  const Y = String(d.getUTCFullYear());
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${Y}${M}${D}T${h}${m}${s}`;
}

// Format current timestamp as true UTC for DTSTAMP
function formatDateUTC(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function foldLine(line) {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    parts.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return parts.join('\r\n');
}

export function generateICS({ title, start, end, description, location }) {
  const uid = crypto.randomUUID();
  const dtstamp = formatDateUTC(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'PRODID:-//WAVFD//Scheduler//EN',
    `BEGIN:VTIMEZONE`,
    `TZID:${TIMEZONE}`,
    'BEGIN:STANDARD',
    'DTSTART:16011104T020000',
    'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'TZNAME:EST',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:16010311T020000',
    'RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'TZNAME:EDT',
    'END:DAYLIGHT',
    `END:VTIMEZONE`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${TIMEZONE}:${formatDateLocal(start)}`,
    `DTEND;TZID=${TIMEZONE}:${formatDateLocal(end)}`,
    `SUMMARY:${title}`,
    'STATUS:CONFIRMED',
  ];

  if (description) lines.push(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`);
  if (location) lines.push(`LOCATION:${location}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n');
}
