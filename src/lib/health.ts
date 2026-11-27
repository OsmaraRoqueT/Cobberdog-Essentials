import type { HealthEntry, Repeat } from '../types';
import { uid } from './merge';

const addTo = (date: string, r: Repeat): string => {
  const d = new Date(date + 'T12:00:00');
  switch (r) {
    case '2w':
      d.setDate(d.getDate() + 14);
      break;
    case '1m':
      d.setMonth(d.getMonth() + 1);
      break;
    case '2m':
      d.setMonth(d.getMonth() + 2);
      break;
    case '3m':
      d.setMonth(d.getMonth() + 3);
      break;
    case '6m':
      d.setMonth(d.getMonth() + 6);
      break;
    case '1y':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case '3y':
      d.setFullYear(d.getFullYear() + 3);
      break;
    default:
      return date;
  }
  return d.toLocaleDateString('en-CA');
};

export const todayStr = () => new Date().toLocaleDateString('en-CA');

/** Days from today to `date` (negative = overdue). */
export function daysFrom(date: string, today = todayStr()): number {
  return Math.round((new Date(date + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86_400_000);
}

/**
 * Complete a planned entry. Returns the completed entry plus, for repeating reminders,
 * the next planned one (due one interval after the original due date, so schedules don't drift).
 */
export function completeEntry(entry: HealthEntry, doneOn = todayStr()): { done: HealthEntry; next?: HealthEntry } {
  const done: HealthEntry = { ...entry, status: 'done', date: doneOn };
  const repeat = entry.repeat ?? 'none';
  if (repeat === 'none') return { done };
  let due = addTo(entry.due ?? doneOn, repeat);
  // If the reminder was completed very late, roll forward until the next one is in the future.
  while (due <= doneOn) due = addTo(due, repeat);
  const next: HealthEntry = { ...entry, id: uid(), status: 'planned', date: undefined, due, suggested: entry.suggested };
  return { done, next };
}

export const nextDueDate = addTo;
