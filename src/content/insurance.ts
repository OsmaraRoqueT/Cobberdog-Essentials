import type { L } from '../i18n';

export type CriterionKind = 'money' | 'yesno' | 'text';
export interface Criterion {
  id: string;
  kind: CriterionKind;
  label: L;
  hint?: L;
}

/** The insurance comparison checklist. Owners fill these in from each insurer's quote and policy terms. */
export const INSURANCE_CRITERIA: Criterion[] = [
  { id: 'premium', kind: 'money', label: { en: 'Annual premium', nb: 'Årspremie' } },
  { id: 'excess', kind: 'money', label: { en: 'Excess per claim', nb: 'Egenandel per skade' } },
  {
    id: 'copay',
    kind: 'text',
    label: { en: 'Co-payment (%)', nb: 'Prosentvis egenandel' },
    hint: { en: 'Extra % of each bill you pay yourself, if any', nb: 'Ekstra prosent av regningen du betaler selv, om noen' },
  },
  { id: 'vetLimit', kind: 'money', label: { en: 'Annual vet-cost limit', nb: 'Maks veterinærutgifter per år' } },
  { id: 'lifeCover', kind: 'money', label: { en: 'Life cover', nb: 'Livsforsikring' } },
  {
    id: 'hereditary',
    kind: 'yesno',
    label: { en: 'Hereditary & congenital conditions covered', nb: 'Dekker arvelige og medfødte lidelser' },
    hint: { en: 'Hips, elbows, eyes: important for doodle-type breeds', nb: 'Hofter, albuer, øyne: viktig for doodle-raser' },
  },
  { id: 'waiting', kind: 'text', label: { en: 'Waiting period (illness)', nb: 'Karenstid (sykdom)' } },
  { id: 'directSettlement', kind: 'yesno', label: { en: 'Direct settlement with clinics', nb: 'Direkte oppgjør med klinikker' } },
  { id: 'dental', kind: 'yesno', label: { en: 'Dental treatment', nb: 'Tannbehandling' } },
  { id: 'behaviour', kind: 'yesno', label: { en: 'Behavioural treatment', nb: 'Atferdsbehandling' } },
  { id: 'rehab', kind: 'yesno', label: { en: 'Physio / rehabilitation', nb: 'Fysioterapi / rehabilitering' } },
  { id: 'abroad', kind: 'yesno', label: { en: 'Cover when travelling abroad', nb: 'Dekning på reise i utlandet' } },
  { id: 'liability', kind: 'yesno', label: { en: 'Liability cover included', nb: 'Ansvarsforsikring inkludert' } },
  {
    id: 'ageRules',
    kind: 'text',
    label: { en: 'Age rules (price rises, max age)', nb: 'Aldersregler (prisøkning, maksalder)' },
  },
];
