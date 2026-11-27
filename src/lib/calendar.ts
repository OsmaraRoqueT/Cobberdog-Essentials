/**
 * Calendar export so reminders live in the phone's own calendar (works offline, no server, no push setup).
 * - .ics files open the "Add to calendar" sheet on iPhone/iPad/macOS and import on Android/Outlook.
 * - Google Calendar gets a prefilled "create event" link.
 */
export interface CalEvent {
  uid: string;
  title: string;
  date: string; // YYYY-MM-DD, all-day
  description?: string;
}

const compact = (date: string) => date.replace(/-/g, '');
const nextDay = (date: string) => {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
};

/** RFC 5545 text escaping. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold lines longer than 75 octets (RFC 5545 §3.1). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join('\r\n ');
}

export function toICS(events: CalEvent[], stamp = new Date()): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Puppy Essentials//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@puppy-essentials`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
      'TRANSP:TRANSPARENT',
      // Alert at 09:00 the day before (all-day events start at 00:00).
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(e.title)}`,
      'TRIGGER:-PT15H',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadICS(events: CalEvent[], filename: string) {
  const blob = new Blob([toICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function googleCalendarUrl(e: CalEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${compact(e.date)}/${compact(nextDay(e.date))}`,
    details: e.description ?? '',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
