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

export const NOTE_CATEGORIES = [
  'Breed essentials',
  'Vet',
  'Training course',
  'Breeder & pickup',
  'Food & nutrition',
  'Grooming',
  'Insurance & admin',
  'Tips',
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];
export type Decision = 'considering' | 'chosen' | 'rejected';

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

export interface Profile extends Base {
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
}
export type CollectionName = keyof Collections;
export const COLLECTION_NAMES: CollectionName[] = ['profile', 'shopping', 'notes', 'skills', 'sessions', 'social'];
