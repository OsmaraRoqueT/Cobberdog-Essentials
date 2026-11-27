import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { nb } from '../i18n/nb';
import { COLLECTION_NAMES, type Base, type Collections, type Profile } from '../types';
import { applySeed, buildSeed, SEED_TIME, suggestHealth } from './index';
import { BREEDS } from './breeds';
import { COUNTRIES } from './countries';

const empty = (): Collections => ({ profile: [], shopping: [], notes: [], skills: [], sessions: [], social: [], health: [] });
const profile = (p: Partial<Profile>): Profile => ({
  id: 'puppy',
  updatedAt: '2026-11-01T00:00:00.000Z',
  name: 'Kaia',
  breeder: '',
  birthDate: '',
  arrivalDate: '',
  size: '',
  colour: '',
  microchip: '',
  notes: '',
  ...p,
});

describe('seed content', () => {
  it('has unique ids that are identical in every language (so household devices never duplicate)', () => {
    for (const c of COUNTRIES)
      for (const b of BREEDS) {
        const english = buildSeed({ lang: 'en', country: c.code, breed: b.id });
        const norsk = buildSeed({ lang: 'nb', country: c.code, breed: b.id });
        for (const name of COLLECTION_NAMES) {
          const ids = (english[name] as Base[]).map((x) => x.id);
          expect(new Set(ids).size).toBe(ids.length);
          expect((norsk[name] as Base[]).map((x) => x.id)).toEqual(ids);
        }
      }
  });

  it('every generic and Norwegian item is translated to Norwegian', () => {
    const en1 = buildSeed({ lang: 'en', country: 'NO', breed: 'cobberdog' });
    const nb1 = buildSeed({ lang: 'nb', country: 'NO', breed: 'cobberdog' });
    const same = en1.shopping.filter((s, i) => s.name === nb1.shopping[i].name && s.name.length > 6);
    expect(same.map((s) => s.name)).toEqual([]);
  });

  it('adds country and breed content only when selected', () => {
    const no = buildSeed({ lang: 'en', country: 'NO', breed: 'other' });
    const gb = buildSeed({ lang: 'en', country: 'GB', breed: 'cobberdog' });
    expect(no.shopping.some((s) => s.name.includes('Dyreidentitet'))).toBe(true);
    expect(gb.shopping.some((s) => s.name.includes('Dyreidentitet'))).toBe(false);
    expect(no.notes.some((n) => n.title.includes('Cobberdog'))).toBe(false);
    expect(gb.notes.some((n) => n.title.includes('Cobberdog'))).toBe(true);
  });

  it('swaps untouched seed for a new language but keeps the user’s edits', () => {
    const english = buildSeed({ lang: 'en', country: 'NO', breed: 'cobberdog' });
    const crate = english.shopping[0];
    const edited = { ...crate, status: 'bought' as const, updatedAt: '2026-11-20T10:00:00.000Z' };
    const data = { ...english, shopping: [edited, ...english.shopping.slice(1)] };
    const switched = applySeed(data, buildSeed({ lang: 'nb', country: 'NO', breed: 'cobberdog' }));
    expect(switched.shopping.find((s) => s.id === crate.id)).toMatchObject({ status: 'bought', name: crate.name });
    const other = switched.shopping.find((s) => s.id === english.shopping[1].id)!;
    expect(other.updatedAt).toBe(SEED_TIME);
    expect(other.name).not.toBe(english.shopping[1].name);
  });

  it('drops untouched country items when the country changes', () => {
    const no = buildSeed({ lang: 'en', country: 'NO', breed: 'other' });
    const moved = applySeed(no, buildSeed({ lang: 'en', country: 'GB', breed: 'other' }));
    expect(moved.shopping.some((s) => s.name.includes('Dyreidentitet'))).toBe(false);
    expect(applySeed(empty(), no).shopping.length).toBe(no.shopping.length);
  });
});

describe('suggestHealth', () => {
  it('builds a schedule from birth and arrival dates with deterministic ids', () => {
    const p = profile({ country: 'NO', breed: 'cobberdog', birthDate: '2026-10-01', arrivalDate: '2026-12-09' });
    const s = suggestHealth(p, 'nb', '2026-11-27');
    const byId = Object.fromEntries(s.map((x) => [x.id, x]));
    expect(byId['sugg-vacc-12w'].due).toBe('2026-12-24');
    expect(byId['sugg-vet-first'].due).toBe('2026-12-11');
    expect(byId['sugg-leash-start']).toMatchObject({ due: '2027-04-01', repeat: '1y' });
    expect(byId['sugg-groom-intro']).toBeDefined();
    expect(byId['sugg-tick-season'].title).toMatch(/Flått/);
    // 8-week vaccination was yesterday: still shown (check the breeder's card).
    expect(byId['sugg-vacc-8w'].due).toBe('2026-11-26');
    // One-off milestones more than 2 weeks in the past are skipped.
    const older = suggestHealth({ ...p, birthDate: '2026-08-01' }, 'nb', '2026-11-27').map((x) => x.id);
    expect(older).not.toContain('sugg-vacc-8w');
    expect(older).toContain('sugg-vacc-1y');
    expect(suggestHealth(p, 'nb', '2026-11-27').map((x) => x.id)).toEqual(s.map((x) => x.id));
  });

  it('only includes Norwegian leash reminders for Norway', () => {
    const p = profile({ country: 'GB', birthDate: '2026-10-01', arrivalDate: '2026-12-09' });
    expect(suggestHealth(p, 'en', '2026-11-27').some((x) => x.id === 'sugg-leash-start')).toBe(false);
  });
});

describe('translations', () => {
  it('Norwegian defines every English key and keeps placeholders', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(nb[key], key).toBeTruthy();
      const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      expect(vars(nb[key]), key).toBe(vars(en[key]));
    }
  });
});
