import { describe, expect, it } from 'vitest';
import { googleCalendarUrl, toICS } from './calendar';
import { completeEntry } from './health';

describe('toICS', () => {
  it('produces a valid all-day event with an alarm, escaped text and folded lines', () => {
    const ics = toICS([{ uid: 'x1', title: 'Vaksine, Kaia; dose 2', date: '2026-12-24', description: 'Line 1\nLine 2 '.repeat(10) }], new Date('2026-11-27T10:00:00Z'));
    expect(ics).toContain('DTSTART;VALUE=DATE:20261224');
    expect(ics).toContain('DTEND;VALUE=DATE:20261225');
    expect(ics).toContain('SUMMARY:Vaksine\\, Kaia\; dose 2');
    expect(ics).toContain('BEGIN:VALARM');
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
  });

  it('handles year boundaries for the end date', () => {
    expect(toICS([{ uid: 'y', title: 't', date: '2026-12-31' }])).toContain('DTEND;VALUE=DATE:20270101');
  });

  it('builds a Google Calendar link', () => {
    const url = googleCalendarUrl({ uid: 'x', title: 'Ormekur', date: '2027-01-05' });
    expect(url).toContain('dates=20270105%2F20270106');
    expect(url).toContain('text=Ormekur');
  });
});

describe('completeEntry', () => {
  const base = { id: 'a', updatedAt: '', kind: 'parasite' as const, title: 'Tick', status: 'planned' as const, due: '2026-03-01' };
  it('creates the next reminder for repeating entries without drifting', () => {
    const { done, next } = completeEntry({ ...base, repeat: '1m' }, '2026-03-04');
    expect(done).toMatchObject({ status: 'done', date: '2026-03-04' });
    expect(next).toMatchObject({ status: 'planned', due: '2026-04-01' });
    expect(next!.id).not.toBe('a');
  });
  it('rolls forward when completed very late', () => {
    const { next } = completeEntry({ ...base, repeat: '2w' }, '2026-04-20');
    expect(next!.due! > '2026-04-20').toBe(true);
  });
  it('does not create a follow-up for one-off entries', () => {
    expect(completeEntry({ ...base, repeat: 'none' }).next).toBeUndefined();
  });
});
