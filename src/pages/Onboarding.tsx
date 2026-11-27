import { useState } from 'react';
import { Field } from '../components/ui';
import { BREEDS } from '../content/breeds';
import { COUNTRIES, countryByCode, countryName } from '../content/countries';
import { LANGS, pick, useI18n, type Lang } from '../i18n';
import { getProfile, PROFILE_ID, useStore } from '../lib/store';
import type { Profile } from '../types';

const ONBOARDED_KEY = 'cobberdog:onboarded';
export const isOnboarded = () => {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
};
const markOnboarded = () => {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    /* ignore */
  }
};

/** Guess the country from the browser locale (e.g. nb-NO → NO); falls back to "other". */
function guessCountry(): string {
  const region = (navigator.language.split('-')[1] ?? '').toUpperCase();
  if (navigator.language.toLowerCase().startsWith('nb') || navigator.language.toLowerCase().startsWith('nn')) return 'NO';
  return COUNTRIES.some((c) => c.code === region) ? region : 'XX';
}

export default function Onboarding({ onDone }: { onDone: (joining: boolean) => void }) {
  const { t, lang, setLang } = useI18n();
  const { data, upsert } = useStore();
  const [country, setCountry] = useState(guessCountry);
  const [breed, setBreed] = useState('cobberdog');
  const [name, setName] = useState('');

  const start = () => {
    const existing = getProfile(data);
    const base: Profile = existing ?? {
      id: PROFILE_ID,
      updatedAt: '',
      name: '',
      breeder: '',
      birthDate: '',
      arrivalDate: '',
      size: '',
      colour: '',
      microchip: '',
      notes: '',
    };
    upsert('profile', { ...base, name: name.trim() || base.name, country, breed, currency: countryByCode(country).currency });
    markOnboarded();
    onDone(false);
  };

  return (
    <div className="onboard">
      <div className="card form">
        <h1>🐾 {t('onboard.title')}</h1>
        <p className="muted">{t('onboard.intro')}</p>
        <Field label={t('onboard.language')}>
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('onboard.country')} hint={t('onboard.countryHint')}>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryName(c.code, lang)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('onboard.breed')} hint={t('onboard.breedHint')}>
          <select value={breed} onChange={(e) => setBreed(e.target.value)}>
            {BREEDS.map((b) => (
              <option key={b.id} value={b.id}>
                {pick(b.name, lang)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('onboard.puppyName')}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('profile.namePlaceholder')} />
        </Field>
        <button className="btn btn-primary" onClick={start}>
          {t('onboard.start')}
        </button>
      </div>
      <div className="card">
        <h2>{t('onboard.joinTitle')}</h2>
        <p className="muted small">{t('onboard.joinText')}</p>
        <button
          className="btn"
          onClick={() => {
            markOnboarded();
            onDone(true);
          }}
        >
          {t('onboard.join')}
        </button>
      </div>
    </div>
  );
}
