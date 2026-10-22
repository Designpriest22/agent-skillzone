import type { APIRoute } from 'astro';
import { EVENT, SEO, calendarDates, venueFullAddress } from '../config/event';

// All-day entry: accurate before set times are confirmed.
const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// RFC 5545 §3.1: lines longer than 75 octets are folded (CRLF + one space).
const fold = (line: string) => {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (enc.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
};

export const GET: APIRoute = ({ site }) => {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SEASON FEST//Christmas Eve 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:season-fest-${EVENT.date}@meatandgreet`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${calendarDates.start}`,
    `DTEND;VALUE=DATE:${calendarDates.end}`,
    `SUMMARY:${escape(`${EVENT.fullName} — ${EVENT.parentBrand} Christmas Eve`)}`,
    `DESCRIPTION:${escape(SEO.description)}`,
    `LOCATION:${escape(venueFullAddress)}`,
    ...(site ? [`URL:${site.href}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
