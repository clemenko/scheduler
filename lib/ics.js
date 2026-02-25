import crypto from 'crypto';

function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateICS({ title, start, end, description, location }) {
  const uid = crypto.randomUUID();
  const dtstamp = formatDate(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WAVFD//Scheduler//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${title}`,
  ];

  if (description) lines.push(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`);
  if (location) lines.push(`LOCATION:${location}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}
