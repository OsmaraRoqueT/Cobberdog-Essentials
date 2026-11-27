import type { L } from '../i18n';
import type { HealthKind, Repeat } from '../types';

/** When a suggested reminder falls: N weeks after birth, N days after arrival, or every year on MM-DD. */
export type When = { weeksAfterBirth: number } | { daysAfterArrival: number } | { yearly: string };

export interface HealthSuggestion {
  key: string;
  kind: HealthKind;
  title: L;
  when: When;
  repeat?: Repeat;
  notes?: L;
}
