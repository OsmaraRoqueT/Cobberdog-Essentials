import { pick, type Lang } from '../i18n';
import { mergeRecords } from '../lib/merge';
import { COLLECTION_NAMES, type Base, type Collections, type HealthEntry, type Profile } from '../types';
import { breedById } from './breeds';
import { countryByCode } from './countries';
import { generic } from './generic';
import type { HealthSuggestion } from './suggest-types';
import type { ContentPack } from './types';

/**
 * Seed records get ids derived from their English text ("seed-shop-crate-…") and an old
 * fixed timestamp. That means:
 *  - two household devices seed identical ids, so sync merges instead of duplicating;
 *  - any edit by the user is newer, so it always wins over the seed;
 *  - untouched seed records can be swapped for another language/country/breed at any time.
 */
export const SEED_TIME = '2026-01-01T00:00:00.000Z';
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export interface SeedOptions {
  lang: Lang;
  country?: string;
  breed?: string;
}

export function buildSeed({ lang, country, breed }: SeedOptions): Collections {
  const packs: ContentPack[] = [generic, countryByCode(country).pack ?? {}, breedById(breed).pack ?? {}];
  const out: Collections = { profile: [], shopping: [], notes: [], skills: [], sessions: [], social: [], health: [] };
  const seen = new Set<string>();
  const push = <T extends Base>(list: T[], rec: T) => {
    if (seen.has(rec.id)) return; // first pack wins on duplicate ids
    seen.add(rec.id);
    list.push(rec);
  };

  for (const pack of packs) {
    for (const cat of pack.shopping ?? [])
      for (const i of cat.items)
        push(out.shopping, {
          id: `seed-shop-${slug(i.name.en)}`,
          updatedAt: SEED_TIME,
          name: pick(i.name, lang),
          category: pick(cat.category, lang),
          priority: i.priority,
          status: 'todo',
          tip: i.tip && pick(i.tip, lang),
        });
    for (const n of pack.notes ?? [])
      push(out.notes, {
        id: `seed-note-${slug(n.title.en)}`,
        updatedAt: SEED_TIME,
        title: pick(n.title, lang),
        category: n.category,
        kind: 'note',
        body: pick(n.body, lang),
        pinned: n.pinned,
      });
    for (const g of pack.skills ?? [])
      for (const s of g.items)
        push(out.skills, {
          id: `seed-skill-${slug(s.name.en)}`,
          updatedAt: SEED_TIME,
          name: pick(s.name, lang),
          group: pick(g.group, lang),
          status: 'not-started',
          howTo: pick(s.howTo, lang),
        });
    for (const g of pack.social ?? [])
      for (const s of g.items)
        push(out.social, { id: `seed-social-${slug(s.en)}`, updatedAt: SEED_TIME, name: pick(s, lang), group: pick(g.group, lang), count: 0 });
  }
  return out;
}

/** An untouched seed record: still exactly as the app created it. */
export const isPristineSeed = (r: Base) => r.id.startsWith('seed-') && r.updatedAt === SEED_TIME && !r.deleted;

/**
 * Lay the current seed under the user's data: pristine seed records are replaced by the current
 * language/country/breed version (or dropped if no longer applicable); edited ones are kept.
 */
export function applySeed(data: Collections, seed: Collections): Collections {
  const out = {} as Collections;
  for (const name of COLLECTION_NAMES) {
    const mine = (data[name] as Base[]).filter((r) => !isPristineSeed(r));
    (out[name] as Base[]) = mergeRecords(seed[name] as Base[], mine);
  }
  return out;
}

// ---------- Suggested health schedule ----------

const GENERIC_HEALTH: HealthSuggestion[] = [
  {
    key: 'vacc-8w',
    kind: 'vaccine',
    title: { en: 'Puppy vaccination 1 (often done by breeder: check the card)', nb: 'Valpevaksine 1 (tas ofte hos oppdretter: sjekk vaksinekortet)' },
    when: { weeksAfterBirth: 8 },
  },
  { key: 'vacc-12w', kind: 'vaccine', title: { en: 'Puppy vaccination 2', nb: 'Valpevaksine 2' }, when: { weeksAfterBirth: 12 } },
  {
    key: 'vacc-16w',
    kind: 'vaccine',
    title: { en: 'Puppy vaccination 3 (if your vet recommends it)', nb: 'Valpevaksine 3 (hvis veterinæren anbefaler det)' },
    when: { weeksAfterBirth: 16 },
  },
  { key: 'vacc-1y', kind: 'vaccine', title: { en: 'Booster vaccination (about 1 year)', nb: 'Oppfriskningsvaksine (ca. 1 år)' }, when: { weeksAfterBirth: 56 } },
  {
    key: 'vet-first',
    kind: 'vet',
    title: { en: 'First vet check after pickup', nb: 'Første veterinærsjekk etter henting' },
    when: { daysAfterArrival: 2 },
    notes: {
      en: 'Bring the vaccination card and breeder papers. Ask about a worming and flea/tick plan, and when to neuter (if relevant).',
      nb: 'Ta med vaksinekort og papirer fra oppdretter. Spør om plan for ormekur, flått og lopper, og eventuelt kastrering.',
    },
  },
];

const addDays = (date: string, n: number) => {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
};

function resolveDate(s: HealthSuggestion, profile: Pick<Profile, 'birthDate' | 'arrivalDate'>, today: string): string | null {
  const w = s.when;
  if ('weeksAfterBirth' in w) return profile.birthDate ? addDays(profile.birthDate, w.weeksAfterBirth * 7) : null;
  if ('daysAfterArrival' in w) return profile.arrivalDate ? addDays(profile.arrivalDate, w.daysAfterArrival) : null;
  // Yearly: the next occurrence on/after today.
  const year = Number(today.slice(0, 4));
  const thisYear = `${year}-${w.yearly}`;
  return thisYear >= today ? thisYear : `${year + 1}-${w.yearly}`;
}

/**
 * Suggested reminders for this puppy. Ids are deterministic ("sugg-<key>") so pressing
 * the button twice, or on two devices, never creates duplicates.
 */
export function suggestHealth(profile: Profile | undefined, lang: Lang, today = new Date().toLocaleDateString('en-CA')): HealthEntry[] {
  if (!profile) return [];
  const all = [...GENERIC_HEALTH, ...(countryByCode(profile.country).health ?? []), ...(breedById(profile.breed).health ?? [])];
  const out: HealthEntry[] = [];
  for (const s of all) {
    const due = resolveDate(s, profile, today);
    if (!due) continue;
    // Skip one-off milestones already more than 2 weeks in the past.
    if (!s.repeat && due < addDays(today, -14)) continue;
    out.push({
      id: `sugg-${s.key}`,
      updatedAt: '',
      kind: s.kind,
      title: pick(s.title, lang),
      status: 'planned',
      due,
      repeat: s.repeat ?? 'none',
      notes: s.notes && pick(s.notes, lang),
      suggested: true,
    });
  }
  return out;
}
