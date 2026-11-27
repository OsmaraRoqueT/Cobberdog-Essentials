import { useMemo, useState } from 'react';
import { Chips, Empty, Field, groupBy, Progress, Sheet } from '../components/ui';
import { uid } from '../lib/merge';
import { useI18n, type MessageKey } from '../i18n';
import { useCollection, useStore } from '../lib/store';
import type { Session, Skill, SkillStatus, SocialItem } from '../types';

type View = 'skills' | 'sessions' | 'social';

const STATUSES: SkillStatus[] = ['not-started', 'learning', 'practising', 'reliable'];
/** Positive exposures per item before we count it as "done". */
const SOCIAL_TARGET = 3;

export default function Training() {
  const [view, setView] = useState<View>('skills');
  const { t } = useI18n();
  const VIEWS = [
    { value: 'skills', label: t('train.skills') },
    { value: 'sessions', label: t('train.sessions') },
    { value: 'social', label: t('train.social') },
  ] as const;
  return (
    <div className="stack">
      <h1>{t('train.title')}</h1>
      <Chips label={t('train.title')} options={VIEWS} value={view} onChange={setView} />
      {view === 'skills' && <Skills />}
      {view === 'sessions' && <Sessions />}
      {view === 'social' && <Social />}
    </div>
  );
}

function Skills() {
  const skills = useCollection('skills');
  const { upsert } = useStore();
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Skill | null>(null);
  const groups = groupBy(skills, (s) => s.group);

  return (
    <>
      <div className="row-between">
        <Progress label={t('train.reliable')} value={skills.filter((s) => s.status === 'reliable').length} total={skills.length} />
      </div>
      {groups.map(([group, list]) => (
        <section className="card" key={group}>
          <h2>{group}</h2>
          <ul className="item-list">
            {list.map((s) => (
              <li key={s.id}>
                <div className="item-main">
                  <button className="item-title" onClick={() => setOpen(open === s.id ? null : s.id)}>
                    {s.name}
                  </button>
                  <button
                    className={`status status-${s.status}`}
                    title={t('train.tapToAdvance')}
                    onClick={() => upsert('skills', { ...s, status: STATUSES[(STATUSES.indexOf(s.status) + 1) % STATUSES.length] })}
                  >
                    {t(`skill.${s.status}` as MessageKey)}
                  </button>
                </div>
                {open === s.id && (
                  <div className="item-detail">
                    {s.howTo && <p>📖 {s.howTo}</p>}
                    {s.notes && <p>📝 {s.notes}</p>}
                    <button className="btn btn-small" onClick={() => setEditing(s)}>
                      {t('common.edit')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <button
        className="btn"
        onClick={() => setEditing({ id: uid(), updatedAt: '', name: '', group: groups[0]?.[0] ?? 'Custom', status: 'not-started' })}
      >
        {t('train.addSkill')}
      </button>
      {editing && <SkillSheet skill={editing} groups={groups.map(([g]) => g)} isNew={!skills.some((s) => s.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

function SkillSheet({ skill, groups, isNew, onClose }: { skill: Skill; groups: string[]; isNew: boolean; onClose: () => void }) {
  const { upsert, remove } = useStore();
  const { t } = useI18n();
  const [s, setS] = useState(skill);
  return (
    <Sheet title={isNew ? t('train.addSkillTitle') : t('train.editSkillTitle')} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!s.name.trim()) return;
          upsert('skills', { ...s, name: s.name.trim(), group: s.group.trim() || 'Custom' });
          onClose();
        }}
      >
        <Field label={t('train.skillName')}>
          <input required value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} autoFocus />
        </Field>
        <div className="grid-2">
          <Field label={t('common.group')}>
            <input list="skill-groups" value={s.group} onChange={(e) => setS({ ...s, group: e.target.value })} />
            <datalist id="skill-groups">
              {groups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>
          <Field label={t('common.status')}>
            <select value={s.status} onChange={(e) => setS({ ...s, status: e.target.value as SkillStatus })}>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`skill.${st}` as MessageKey)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t('train.howTo')}>
          <textarea rows={3} value={s.howTo ?? ''} onChange={(e) => setS({ ...s, howTo: e.target.value })} />
        </Field>
        <Field label={t('common.myNotes')}>
          <textarea rows={3} value={s.notes ?? ''} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder={t('train.skillNotesPlaceholder')} />
        </Field>
        <div className="row-between">
          {!isNew ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(t('common.confirmDelete', { name: s.name }))) {
                  remove('skills', s.id);
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

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

function Sessions() {
  const sessions = useCollection('sessions');
  const skills = useCollection('skills');
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState<Session | null>(null);
  const skillName = useMemo(() => new Map(skills.map((s) => [s.id, s.name])), [skills]);
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toLocaleDateString('en-CA');
  const weekMinutes = sessions.filter((s) => s.date >= weekAgo).reduce((m, s) => m + s.minutes, 0);

  return (
    <>
      <div className="row-between">
        <p className="muted">{t('train.weekMinutes', { n: weekMinutes })}</p>
        <button
          className="btn btn-primary"
          onClick={() => setEditing({ id: uid(), updatedAt: '', date: today(), skillIds: [], minutes: 5, rating: 3, notes: '' })}
        >
          {t('train.logSession')}
        </button>
      </div>
      <p className="muted small">{t('train.sessionTip')}</p>
      {sorted.length === 0 && <Empty>{t('train.noSessions')}</Empty>}
      {sorted.map((s) => (
        <article key={s.id} className="card clickable" onClick={() => setEditing(s)}>
          <div className="row-between">
            <strong>{new Date(s.date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
            <span className="muted">
              {s.minutes} min · {'★'.repeat(s.rating)}
            </span>
          </div>
          {s.skillIds.length > 0 && <p className="tag">{s.skillIds.map((id) => skillName.get(id) ?? t('train.deletedSkill')).join(', ')}</p>}
          {s.notes && <p className="note-body">{s.notes}</p>}
        </article>
      ))}
      {editing && <SessionSheet session={editing} isNew={!sessions.some((s) => s.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

function SessionSheet({ session, isNew, onClose }: { session: Session; isNew: boolean; onClose: () => void }) {
  const { upsert, remove } = useStore();
  const skills = useCollection('skills');
  const { t } = useI18n();
  const [s, setS] = useState(session);
  const toggleSkill = (id: string) =>
    setS({ ...s, skillIds: s.skillIds.includes(id) ? s.skillIds.filter((x) => x !== id) : [...s.skillIds, id] });

  return (
    <Sheet title={isNew ? t('train.logTitle') : t('train.editSessionTitle')} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          upsert('sessions', s);
          onClose();
        }}
      >
        <div className="grid-2">
          <Field label={t('common.date')}>
            <input type="date" required value={s.date} onChange={(e) => setS({ ...s, date: e.target.value })} />
          </Field>
          <Field label={t('train.minutes')}>
            <input type="number" min={1} inputMode="numeric" value={s.minutes} onChange={(e) => setS({ ...s, minutes: Number(e.target.value) || 1 })} />
          </Field>
        </div>
        <Field label={t('train.howDidItGo')}>
          <select value={s.rating} onChange={(e) => setS({ ...s, rating: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {t(`train.r${r}` as MessageKey)}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="field">
          <legend className="field-label">{t('train.skillsPractised')}</legend>
          <div className="chips wrap">
            {skills.map((sk) => (
              <button
                type="button"
                key={sk.id}
                aria-pressed={s.skillIds.includes(sk.id)}
                className={`chip ${s.skillIds.includes(sk.id) ? 'chip-on' : ''}`}
                onClick={() => toggleSkill(sk.id)}
              >
                {sk.name}
              </button>
            ))}
          </div>
        </fieldset>
        <Field label={t('common.notes')}>
          <textarea rows={3} value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder={t('train.sessionNotesPlaceholder')} />
        </Field>
        <div className="row-between">
          {!isNew ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(t('common.confirmDeleteEntry'))) {
                  remove('sessions', s.id);
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

function Social() {
  const items = useCollection('social');
  const { upsert, remove } = useStore();
  const { t } = useI18n();
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const groups = groupBy(items, (i) => i.group);
  const done = items.filter((i) => i.count >= SOCIAL_TARGET).length;

  const bump = (i: SocialItem, d: number) => upsert('social', { ...i, count: Math.max(0, i.count + d) });

  return (
    <>
      <Progress label={t('train.socialProgress', { n: SOCIAL_TARGET })} value={done} total={items.length} />
      <p className="muted small">{t('train.socialTip')}</p>
      {groups.map(([group, list]) => (
        <section className="card" key={group}>
          <h2>{group}</h2>
          <ul className="item-list">
            {list.map((i) => (
              <li key={i.id} className={i.count >= SOCIAL_TARGET ? 'done-soft' : ''}>
                <div className="item-main">
                  <span className="item-title static">{i.name}</span>
                  <div className="counter">
                    <button className="icon-btn" aria-label={t('train.oneLess', { name: i.name })} onClick={() => bump(i, -1)} disabled={i.count === 0}>
                      −
                    </button>
                    <span className="count">{i.count}</span>
                    <button className="icon-btn" aria-label={t('train.oneMore', { name: i.name })} onClick={() => bump(i, 1)}>
                      +
                    </button>
                    {!i.id.startsWith('seed-') && (
                      <button className="icon-btn" aria-label={`${t('common.delete')}: ${i.name}`} onClick={() => confirm(t('common.confirmDelete', { name: i.name })) && remove('social', i.id)}>
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          upsert('social', { id: uid(), updatedAt: '', name: newName.trim(), group: newGroup.trim() || 'Other', count: 0 });
          setNewName('');
        }}
      >
        <h2>{t('train.addExperience')}</h2>
        <div className="grid-2">
          <Field label={t('train.experience')}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('train.experiencePlaceholder')} />
          </Field>
          <Field label={t('common.group')}>
            <input list="social-groups" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder={groups[0]?.[0] ?? ''} />
            <datalist id="social-groups">
              {groups.map(([g]) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>
        </div>
        <button className="btn" type="submit">
          {t('common.add')}
        </button>
      </form>
    </>
  );
}
