import { useState } from 'react';
import type { TabId } from '../App';
import { Field, Progress, Sheet } from '../components/ui';
import { breedById } from '../content/breeds';
import { countryByCode } from '../content/countries';
import { pick, useI18n } from '../i18n';
import { daysFrom } from '../lib/health';
import { getProfile, PROFILE_ID, useCollection, useStore } from '../lib/store';
import type { Profile } from '../types';
import { DueLabel } from './Health';

export function formatMoney(amount: number, currency: string, locale?: string) {
  try {
    return amount.toLocaleString(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
  } catch {
    return `${amount.toFixed(0)} ${currency}`;
  }
}

export default function Home({ go }: { go: (t: TabId) => void }) {
  const { t, locale } = useI18n();
  const { data, upsert } = useStore();
  const profile = getProfile(data);
  const shopping = useCollection('shopping');
  const notes = useCollection('notes');
  const skills = useCollection('skills');
  const health = useCollection('health');
  const [editing, setEditing] = useState(false);

  const active = shopping.filter((s) => s.status !== 'skip');
  const essentials = active.filter((s) => s.priority === 'essential');
  const bought = active.filter((s) => s.status === 'bought');
  const nextUp = essentials.filter((s) => s.status === 'todo').slice(0, 5);
  const spent = shopping.reduce((sum, s) => sum + (s.status === 'bought' ? (s.cost ?? 0) : 0), 0);
  const currency = profile?.currency || countryByCode(profile?.country).currency;
  const chosen = (cat: string) => notes.find((n) => n.category === cat && n.kind === 'option' && n.decision === 'chosen');
  const vet = chosen('vet');
  const course = chosen('course');
  const reliable = skills.filter((s) => s.status === 'reliable').length;
  const upcoming = health
    .filter((h) => h.status === 'planned' && h.due)
    .sort((a, b) => a.due!.localeCompare(b.due!))
    .slice(0, 4);

  const until = profile?.arrivalDate ? daysFrom(profile.arrivalDate) : null;
  const name = profile?.name || t('home.yourPuppy');
  const age = (() => {
    if (!profile?.birthDate) return null;
    const days = -daysFrom(profile.birthDate);
    if (days < 0) return t('home.notBorn');
    return days < 182 ? t('home.weeksOld', { n: Math.floor(days / 7) }) : t('home.monthsOld', { n: Math.floor(days / 30.44) });
  })();

  return (
    <div className="dash">
      <section className="card hero span-2">
        <div>
          <h1>{profile?.name ? `${profile.name} 🐶` : t('home.welcome')}</h1>
          <p className="muted">
            {until === null
              ? t('home.addPuppyHint')
              : until > 1
                ? t('home.daysUntil', { n: until, name })
                : until === 1
                  ? t('home.dayUntil', { name })
                  : until === 0
                    ? t('home.pickupDay')
                    : until === -1
                      ? t('home.homeFor1')
                      : t('home.homeFor', { n: -until })}
            {age && ` · ${age}`}
          </p>
        </div>
        <button className="btn" onClick={() => setEditing(true)}>
          {profile?.name || profile?.birthDate ? t('common.edit') : t('home.addPuppy')}
        </button>
      </section>

      <section className="card">
        <div className="row-between">
          <h2>{t('home.comingUp')}</h2>
          <button className="link-btn" onClick={() => go('health')}>
            {t('home.allLink')}
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted">{t('home.nothingDue')}</p>
        ) : (
          <ul className="plain-list">
            {upcoming.map((h) => (
              <li key={h.id}>
                <span>{h.title}</span>
                <DueLabel due={h.due!} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>{t('home.gettingReady')}</h2>
        <Progress label={t('home.essentialsBought')} value={essentials.filter((s) => s.status === 'bought').length} total={essentials.length} />
        <Progress label={t('home.wholeList')} value={bought.length} total={active.length} />
        <Progress label={t('home.skillsReliable')} value={reliable} total={skills.length} />
        {spent > 0 && <p className="muted small">{t('home.spent', { amount: formatMoney(spent, currency, locale) })}</p>}
      </section>

      <section className="card">
        <h2>{t('home.keyDecisions')}</h2>
        <ul className="plain-list">
          <li>
            <span>{t('home.vet')}</span>
            <button className="link-btn" onClick={() => go('knowledge')}>
              {vet ? vet.provider || vet.title : t('home.notChosen')}
            </button>
          </li>
          <li>
            <span>{t('home.course')}</span>
            <button className="link-btn" onClick={() => go('knowledge')}>
              {course ? course.provider || course.title : t('home.notChosen')}
            </button>
          </li>
        </ul>
      </section>

      <section className="card">
        <div className="row-between">
          <h2>{t('home.nextEssentials')}</h2>
          <button className="link-btn" onClick={() => go('shopping')}>
            {t('home.allLink')}
          </button>
        </div>
        {nextUp.length === 0 ? (
          <p className="muted">{t('home.allCovered')}</p>
        ) : (
          <ul className="check-list">
            {nextUp.map((s) => (
              <li key={s.id}>
                <label>
                  <input type="checkbox" checked={false} onChange={() => upsert('shopping', { ...s, status: 'bought' })} />
                  <span>{s.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && <ProfileSheet profile={profile} onClose={() => setEditing(false)} />}
    </div>
  );
}

export function ProfileSheet({ profile, onClose }: { profile?: Profile; onClose: () => void }) {
  const { upsert } = useStore();
  const { t, lang } = useI18n();
  const [p, setP] = useState<Profile>(
    profile ?? { id: PROFILE_ID, updatedAt: '', name: '', breeder: '', birthDate: '', arrivalDate: '', size: '', colour: '', microchip: '', notes: '' },
  );
  const set = (k: keyof Profile) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value });
  const sizes = breedById(p.breed).sizes;
  return (
    <Sheet title={t('profile.title')} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          upsert('profile', p);
          onClose();
        }}
      >
        <Field label={t('profile.name')}>
          <input value={p.name} onChange={set('name')} placeholder={t('profile.namePlaceholder')} />
        </Field>
        <div className="grid-2">
          <Field label={t('profile.birth')}>
            <input type="date" value={p.birthDate} onChange={set('birthDate')} />
          </Field>
          <Field label={t('profile.arrival')}>
            <input type="date" value={p.arrivalDate} onChange={set('arrivalDate')} />
          </Field>
        </div>
        <div className="grid-2">
          <Field label={t('profile.size')}>
            {sizes ? (
              <select value={p.size} onChange={set('size')}>
                <option value="">—</option>
                {sizes.map((s) => (
                  <option key={s.en} value={pick(s, lang)}>
                    {pick(s, lang)}
                  </option>
                ))}
              </select>
            ) : (
              <input value={p.size} onChange={set('size')} />
            )}
          </Field>
          <Field label={t('profile.colour')}>
            <input value={p.colour} onChange={set('colour')} />
          </Field>
        </div>
        <Field label={t('profile.breeder')}>
          <input value={p.breeder} onChange={set('breeder')} />
        </Field>
        <Field label={t('profile.microchip')}>
          <input value={p.microchip} onChange={set('microchip')} inputMode="numeric" />
        </Field>
        <Field label={t('common.notes')}>
          <textarea rows={3} value={p.notes} onChange={set('notes')} />
        </Field>
        <button className="btn btn-primary" type="submit">
          {t('common.save')}
        </button>
      </form>
    </Sheet>
  );
}
