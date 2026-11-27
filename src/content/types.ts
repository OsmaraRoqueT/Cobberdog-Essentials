import type { L } from '../i18n';
import type { NoteCategory, Priority } from '../types';

export interface ShopSeed {
  name: L;
  priority: Priority;
  tip?: L;
}
export interface NoteSeed {
  title: L;
  category: NoteCategory;
  body: L;
  pinned?: boolean;
}
/** A provider pre-listed for comparison (e.g. insurers in a country). Only name + website: the owner fills in the rest. */
export interface OptionSeed {
  provider: string;
  category: NoteCategory;
  link?: string;
}
export interface SkillSeed {
  name: L;
  howTo: L;
}

/** A pack of starter content. Generic content, country packs and breed packs all use this shape. */
export interface ContentPack {
  shopping?: { category: L; items: ShopSeed[] }[];
  notes?: NoteSeed[];
  options?: OptionSeed[];
  /** Country-specific note about comparing insurers (independent sources, local rules). */
  insuranceNote?: NoteSeed;
  skills?: { group: L; items: SkillSeed[] }[];
  social?: { group: L; items: L[] }[];
}
