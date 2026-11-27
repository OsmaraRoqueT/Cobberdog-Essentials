/** Every stored record carries an id + timestamp so households can merge edits (last write wins). */
export interface Base {
  id: string;
  updatedAt: string;
  /** Soft-delete so deletions propagate to other devices. */
  deleted?: boolean;
}

export type Priority = 'essential' | 'recommended' | 'nice';
export type ShoppingStatus = 'todo' | 'bought' | 'skip';

export interface ShoppingItem extends Base {
  name: string;
  category: string;
  priority: Priority;
  status: ShoppingStatus;
  tip?: string;
  cost?: number;
  store?: string;
  link?: string;
  notes?: string;
}

/** Category keys are stable ids; labels come from the translation dictionary. */
export const NOTE_CATEGORIES = ['breed', 'vet', 'insurance', 'course', 'breeder', 'food', 'grooming', 'admin', 'tips'] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];
export type Decision = 'considering' | 'chosen' | 'rejected';
export type Tri = 'yes' | 'no' | 'unknown';

/** A note is either plain research ("note") or a provider you're comparing ("option"). */
export interface Note extends Base {
  title: string;
  category: NoteCategory;
  kind: 'note' | 'option';
  body: string;
  pinned?: boolean;
  provider?: string;
  contact?: string;
  cost?: string;
  link?: string;
  pros?: string;
  cons?: string;
  decision?: Decision;
  rating?: number;

  // Vet clinics (found via Google Places). Only the place id is Google's; other fields are the owner's own record.
  placeId?: string;
  address?: string;
  distanceKm?: number;
  emergency?: Tri;
  fearFree?: Tri;
  /** Direct settlement (direkte oppgjør) with each insurer, keyed by insurer name. */
  settlement?: Record<string, Tri>;

  // Insurance options: answers to the comparison checklist, keyed by criterion id.
  answers?: Record<string, string>;
}

export type SkillStatus = 'not-started' | 'learning' | 'practising' | 'reliable';

export interface Skill extends Base {
  name: string;
  group: string;
  status: SkillStatus;
  howTo?: string;
  notes?: string;
}

export interface Session extends Base {
  date: string;
  skillIds: string[];
  minutes: number;
  rating: number;
  notes: string;
}

export interface SocialItem extends Base {
  name: string;
  group: string;
  count: number;
  notes?: string;
}

export type HealthKind = 'vaccine' | 'worming' | 'parasite' | 'vet' | 'weight' | 'grooming' | 'medication' | 'other';
export type Repeat = 'none' | '2w' | '1m' | '2m' | '3m' | '6m' | '1y' | '3y';

/** A planned reminder (status "planned", has `due`) or something that happened (status "done", has `date`). */
export interface HealthEntry extends Base {
  kind: HealthKind;
  title: string;
  status: 'planned' | 'done';
  date?: string;
  due?: string;
  repeat?: Repeat;
  weightKg?: number;
  notes?: string;
  /** Set on entries created from the suggested schedule, so they can be explained as suggestions. */
  suggested?: boolean;
}

/** Household-wide settings live on the (single) profile record so they sync to every device. */
export interface Profile extends Base {
  country?: string;
  breed?: string;
  currency?: string;
  /** Used to find nearby vets. */
  postcode?: string;
  name: string;
  breeder: string;
  birthDate: string;
  arrivalDate: string;
  size: string;
  colour: string;
  microchip: string;
  notes: string;
}

export interface Collections {
  profile: Profile[];
  shopping: ShoppingItem[];
  notes: Note[];
  skills: Skill[];
  sessions: Session[];
  social: SocialItem[];
  health: HealthEntry[];
}
export type CollectionName = keyof Collections;
export const COLLECTION_NAMES: CollectionName[] = ['profile', 'shopping', 'notes', 'skills', 'sessions', 'social', 'health'];
