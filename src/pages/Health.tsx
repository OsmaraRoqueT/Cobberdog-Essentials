import { useState } from 'react';
import { Empty, Field, Sheet } from '../components/ui';
import { suggestHealth } from '../content';
import { countryName } from '../content/countries';
import { useI18n, type MessageKey } from '../i18n';
import { downloadICS, googleCalendarUrl, type CalEvent } from '../lib/calendar';
import { completeEntry, daysFrom, todayStr } from '../lib/health';
import { uid } from '../lib/merge';
import { getProfile, useCollection, useStore } from '../lib/store';
import type { HealthEntry, HealthKind, Repeat } from '../types';

const KINDS: HealthKind[] = ['vaccine', 'worming', 'parasite', 'vet', 'weight', 'grooming', 'medication', 'other'];
const REPEATS: Repeat[] = ['none', '2w', '1m', '2m', '3m', '6m', '1y', '3y'];
const ICON: Record<HealthKind, string> = {
  vaccine: '💉',
  worming: '🪱',
  parasite: '🕷️',
  vet: '🩺',
  weight: '⚖️',
  grooming: '✂️',
  medication: '💊',
  other: '📌',
};

export function DueLabel({ due }: { due: string }) {
  const { t, locale } = useI18n();
  const d = daysFrom(due);
  const date = new Date(due + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const rel = d < 0 ? t('health.overdue', { n: -d }) : d === 0 ? t('health.today') : t('health.inDays', { n: d });
  return (
    <span className={`due ${d < 0 ? 'due-over' : d <= 7 ? 'due-soon' : ''}`}>
      {date} · {rel}
    </span>
  );
}

export default function Health() {
  const { t, lang, locale } = useI18n();
  const { data, upsert } = useStore();
  const profile = getProfile(data);
  const entries = useCollection('health');
  const [editing, setEditing] = useState<HealthEntry | null>(null);
  const [calFor, setCalFor] = useState<CalEvent[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const upcoming = entries.filter((e) => e.status === 'planned' && e.due).sort((a, b) => a.due!.localeCompare(b.due!));
  const history = entries
    .filter((e) => e.status === 'done' && e.kind !== 'weight')
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const weights = entries
    .filter((e) => e.kind === 'weight' && e.weightKg && e.date)
    .sort((a, b) => a.date!.localeCompare(b.date!));

  const toEvent = (e: HealthEntry): CalEvent => ({
    uid: e.id,
    title: `${ICON[e.kind]} ${profile?.name ? profile.name + ': ' : ''}${e.title}`,
    date: e.due!,
    description: [e.notes, t('health.calendarReminderNote')].filter(Boolean).join('\n\n'),
  });

  const blank = (): HealthEntry => ({ id: uid(), updatedAt: '', kind: 'vet', title: '', status: 'planned', due: todayStr(), repeat: 'none' });

  const addSuggestions = () => {
    const existing = new Set(entries.map((e) => e.id));
    // Also skip suggestions that were completed and rolled into a new id.
    const titles = new Set(entries.map((e) => e.title));
    const fresh = suggestHealth(profile, lang).filter((s) => !existing.has(s.id) && !titles.has(s.title));
    fresh.forEach((s) => upsert('health', s));
    setMsg(fresh.length ? t('health.suggestAdded', { n: fresh.length }) : t('health.suggestNone'));
  };

  const hasDates = Boolean(profile?.birthDate && profile?.arrivalDate);
  const fmt = (d?: string) => (d ? new Date(d + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

  return (
    <div className="dash">
      <div className="row-between span-2">
        <h1>{t('health.title')}</h1>
        <button className="btn btn-primary" onClick={() => setEditing(blank())}>
          {t('health.add')}
        </button>
      </div>

      <section className="card span-2 suggest">
        <h2>{t('health.suggestTitle', { country: countryName(profile?.country ?? 'XX', lang) })}</h2>
        {hasDates ? (
          <>
            <p className="muted small">{t('health.suggestText')}</p>
            <button className="btn" onClick={addSuggestions}>
              {t('health.suggestButton')}
            </button>
          </>
        ) : (
          <p className="muted small">{t('health.suggestNeedDates')}</p>
        )}
        {msg && <p className="notice">{msg}</p>}
      </section>

      <section className="card span-2">
        <div className="row-between">
          <h2>{t('health.upcoming')}</h2>
          {upcoming.length > 1 && (
            <button className="link-btn" onClick={() => setCalFor(upcoming.map(toEvent))}>
              {t('health.calendarAll')}
            </button>
          )}
        </div>
        {upcoming.length === 0 && <Empty>{t('health.noUpcoming')}</Empty>}
        <ul className="item-list">
          {upcoming.map((e) => (
            <li key={e.id}>
              <div className="item-main">
                <span aria-hidden="true">{ICON[e.kind]}</span>
                <button className="item-title" onClick={() => setEditing(e)}>
                  {e.title}
                  {e.suggested && <span className="badge badge-nice inline-badge">{t('health.suggestedBadge')}</span>}
                </button>
              </div>
              <div className="item-sub">
                <DueLabel due={e.due!} />
                {e.repeat && e.repeat !== 'none' && <span className="muted small">↻ {t(`repeat.${e.repeat}` as MessageKey)}</span>}
                <span className="spacer" />
                <button className="btn btn-small" onClick={() => setCalFor([toEvent(e)])}>
                  {t('health.addToCalendar')}
                </button>
                <button
                  className="btn btn-small btn-ok"
                  onClick={() => {
                    const { done, next } = completeEntry(e);
                    upsert('health', done);
                    if (next) upsert('health', next);
                  }}
                >
                  {t('health.markDone')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <WeightCard weights={weights} />

      <section className="card">
        <h2>{t('health.history')}</h2>
        {history.length === 0 && <Empty>{t('health.noHistory')}</Empty>}
        <ul className="item-list">
          {history.map((e) => (
            <li key={e.id}>
              <div className="item-main">
                <span aria-hidden="true">{ICON[e.kind]}</span>
                <button className="item-title" onClick={() => setEditing(e)}>
                  {e.title}
                </button>
                <span className="muted small nowrap">{fmt(e.date)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted small span-2">{t('common.vetDisclaimer')}</p>

      {editing && <EntrySheet entry={editing} isNew={!entries.some((x) => x.id === editing.id)} onClose={() => setEditing(null)} />}
      {calFor && <CalendarSheet events={calFor} onClose={() => setCalFor(null)} />}
    </div>
  );
}

function CalendarSheet({ events, onClose }: { events: CalEvent[]; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Sheet title={t('health.addToCalendar')} onClose={onClose}>
      <div className="form">
        <p className="muted small">{t('health.calendarHelp')}</p>
        <ul className="plain-list">
          {events.map((e) => (
            <li key={e.uid}>
              <span>{e.title}</span>
              <span className="muted small nowrap">{e.date}</span>
            </li>
          ))}
        </ul>
        <button className="btn btn-primary" onClick={() => downloadICS(events, events.length === 1 ? 'reminder' : 'puppy-reminders')}>
          {t('health.phoneCalendar')}
        </button>
        {events.length === 1 && (
          <a className="btn center" href={googleCalendarUrl(events[0])} target="_blank" rel="noreferrer">
            {t('health.googleCalendar')}
          </a>
        )}
      </div>
    </Sheet>
  );
}

function WeightCard({ weights }: { weights: HealthEntry[] }) {
  const { t, locale } = useI18n();
  const { upsert } = useStore();
  const [kg, setKg] = useState('');
  const latest = weights[weights.length - 1];
  const pts = weights.slice(-12);
  const max = Math.max(...pts.map((p) => p.weightKg!), 1);
  const min = Math.min(...pts.map((p) => p.weightKg!), 0);
  const W = 280;
  const H = 70;
  const path = pts
    .map((p, i) => `${i ? 'L' : 'M'}${pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W},${H - ((p.weightKg! - min) / (max - min || 1)) * (H - 10) - 5}`)
    .join(' ');

  return (
    <section className="card">
      <h2>{t('health.weight')}</h2>
      {latest ? (
        <p>
          <strong className="big-num">{latest.weightKg!.toLocaleString(locale)} kg</strong>{' '}
          <span className="muted small">{new Date(latest.date + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
        </p>
      ) : (
        <p className="muted">{t('health.noWeight')}</p>
      )}
      {pts.length > 1 && (
        <svg className="spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('health.weight')}>
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      )}
      <form
        className="row-gap"
        onSubmit={(e) => {
          e.preventDefault();
          const v = Number(kg.replace(',', '.'));
          if (!v || v <= 0) return;
          upsert('health', { id: uid(), updatedAt: '', kind: 'weight', title: `${v} kg`, status: 'done', date: todayStr(), weightKg: v });
          setKg('');
        }}
      >
        <input className="search narrow" inputMode="decimal" placeholder="kg" value={kg} onChange={(e) => setKg(e.target.value)} aria-label={t('health.weightKg')} />
        <button className="btn" type="submit">
          {t('health.logWeight')}
        </button>
      </form>
    </section>
  );
}

function EntrySheet({ entry, isNew, onClose }: { entry: HealthEntry; isNew: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { upsert, remove } = useStore();
  const [e, setE] = useState<HealthEntry>(entry);
  const set = <K extends keyof HealthEntry>(k: K, v: HealthEntry[K]) => setE({ ...e, [k]: v });
  const planned = e.status === 'planned';

  return (
    <Sheet title={isNew ? t('health.addTitle') : t('health.editTitle')} onClose={onClose}>
      <form
        className="form"
        onSubmit={(ev) => {
          ev.preventDefault();
          const title = e.title.trim() || (e.kind === 'weight' && e.weightKg ? `${e.weightKg} kg` : t(`kind.${e.kind}` as MessageKey));
          const clean: HealthEntry = planned
            ? { ...e, title, due: e.due || todayStr(), date: undefined }
            : { ...e, title, date: e.date || todayStr() };
          if (!planned && e.due && isNew) {
            // Logging something as done with a "next due" date also creates the follow-up reminder.
            upsert('health', { ...clean, due: undefined });
            upsert('health', { ...clean, id: uid(), status: 'planned', date: undefined, due: e.due, weightKg: undefined });
          } else {
            upsert('health', clean);
          }
          onClose();
        }}
      >
        <div className="grid-2">
          <Field label={t('health.kind')}>
            <select value={e.kind} onChange={(x) => set('kind', x.target.value as HealthKind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {ICON[k]} {t(`kind.${k}` as MessageKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('common.status')}>
            <select value={e.status} onChange={(x) => set('status', x.target.value as HealthEntry['status'])}>
              <option value="planned">{t('health.planned')}</option>
              <option value="done">{t('health.done')}</option>
            </select>
          </Field>
        </div>
        <Field label={t('health.entryTitle')}>
          <input value={e.title} onChange={(x) => set('title', x.target.value)} placeholder={t('health.titlePlaceholder')} />
        </Field>
        <div className="grid-2">
          {planned ? (
            <Field label={t('health.due')}>
              <input type="date" required value={e.due ?? ''} onChange={(x) => set('due', x.target.value)} />
            </Field>
          ) : (
            <Field label={t('health.dateDone')}>
              <input type="date" required value={e.date ?? ''} onChange={(x) => set('date', x.target.value)} />
            </Field>
          )}
          <Field label={t('health.repeat')}>
            <select value={e.repeat ?? 'none'} onChange={(x) => set('repeat', x.target.value as Repeat)}>
              {REPEATS.map((r) => (
                <option key={r} value={r}>
                  {t(`repeat.${r}` as MessageKey)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {!planned && isNew && (
          <Field label={t('health.nextDue')}>
            <input type="date" value={e.due ?? ''} onChange={(x) => set('due', x.target.value)} />
          </Field>
        )}
        {e.kind === 'weight' && (
          <Field label={t('health.weightKg')}>
            <input
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
              value={e.weightKg ?? ''}
              onChange={(x) => set('weightKg', x.target.value === '' ? undefined : Number(x.target.value))}
            />
          </Field>
        )}
        <Field label={t('common.notes')}>
          <textarea rows={3} value={e.notes ?? ''} onChange={(x) => set('notes', x.target.value)} />
        </Field>
        <div className="row-between">
          {!isNew ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(t('common.confirmDeleteEntry'))) {
                  remove('health', e.id);
                  onClose();
                }
              }}
            >
              {t('common.delete')}
            </button>
          ) : (
            <span />
          )}
          <button className="btn btn-primary" type="submit">
            {t('common.save')}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
