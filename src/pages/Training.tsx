import { useMemo, useState } from 'react';
import { Chips, Empty, Field, groupBy, Progress, Sheet } from '../components/ui';
import { uid } from '../lib/merge';
import { useCollection, useStore } from '../lib/store';
import type { Session, Skill, SkillStatus, SocialItem } from '../types';

type View = 'skills' | 'sessions' | 'social';
const VIEWS = [
  { value: 'skills', label: 'Skills' },
  { value: 'sessions', label: 'Session log' },
  { value: 'social', label: 'Socialisation' },
] as const;

const STATUSES: SkillStatus[] = ['not-started', 'learning', 'practising', 'reliable'];
const STATUS_LABEL: Record<SkillStatus, string> = {
  'not-started': 'Not started',
  learning: 'Learning',
  practising: 'Practising',
  reliable: 'Reliable ✓',
};
/** Positive exposures per item before we count it as "done". */
const SOCIAL_TARGET = 3;

export default function Training() {
  const [view, setView] = useState<View>('skills');
  return (
    <div className="stack">
      <h1>Training</h1>
      <Chips label="Training view" options={VIEWS} value={view} onChange={setView} />
      {view === 'skills' && <Skills />}
      {view === 'sessions' && <Sessions />}
      {view === 'social' && <Social />}
    </div>
  );
}

function Skills() {
  const skills = useCollection('skills');
  const { upsert } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Skill | null>(null);
  const groups = groupBy(skills, (s) => s.group);

  return (
    <>
      <div className="row-between">
        <Progress label="Reliable" value={skills.filter((s) => s.status === 'reliable').length} total={skills.length} />
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
                    title="Tap to advance"
                    onClick={() => upsert('skills', { ...s, status: STATUSES[(STATUSES.indexOf(s.status) + 1) % STATUSES.length] })}
                  >
                    {STATUS_LABEL[s.status]}
                  </button>
                </div>
                {open === s.id && (
                  <div className="item-detail">
                    {s.howTo && <p>📖 {s.howTo}</p>}
                    {s.notes && <p>📝 {s.notes}</p>}
                    <button className="btn btn-small" onClick={() => setEditing(s)}>
                      Edit
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
        + Add skill
      </button>
      {editing && <SkillSheet skill={editing} groups={groups.map(([g]) => g)} isNew={!skills.some((s) => s.id === editing.id)} onClose={() => setEditing(null)} />}
    </>
  );
}

function SkillSheet({ skill, groups, isNew, onClose }: { skill: Skill; groups: string[]; isNew: boolean; onClose: () => void }) {
  const { upsert, remove } = useStore();
  const [s, setS] = useState(skill);
  return (
    <Sheet title={isNew ? 'Add skill' : 'Edit skill'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!s.name.trim()) return;
          upsert('skills', { ...s, name: s.name.trim(), group: s.group.trim() || 'Custom' });
          onClose();
        }}
      >
        <Field label="Skill / cue">
          <input required value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} autoFocus />
        </Field>
        <div className="grid-2">
          <Field label="Group">
            <input list="skill-groups" value={s.group} onChange={(e) => setS({ ...s, group: e.target.value })} />
            <datalist id="skill-groups">
              {groups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>
          <Field label="Status">
            <select value={s.status} onChange={(e) => setS({ ...s, status: e.target.value as SkillStatus })}>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABEL[st]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="How to teach it">
          <textarea rows={3} value={s.howTo ?? ''} onChange={(e) => setS({ ...s, howTo: e.target.value })} />
        </Field>
        <Field label="My notes / progress">
          <textarea rows={3} value={s.notes ?? ''} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder="What the trainer said, what works…" />
        </Field>
        <div className="row-between">
          {!isNew ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(`Delete "${s.name}"?`)) {
                  remove('skills', s.id);
                  onClose();
                }
              }}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <button className="btn btn-primary" type="submit">
            Save
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
  const [editing, setEditing] = useState<Session | null>(null);
  const skillName = useMemo(() => new Map(skills.map((s) => [s.id, s.name])), [skills]);
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toLocaleDateString('en-CA');
  const weekMinutes = sessions.filter((s) => s.date >= weekAgo).reduce((m, s) => m + s.minutes, 0);

  return (
    <>
      <div className="row-between">
        <p className="muted">{weekMinutes} min trained in the last 7 days</p>
        <button
          className="btn btn-primary"
          onClick={() => setEditing({ id: uid(), updatedAt: '', date: today(), skillIds: [], minutes: 5, rating: 3, notes: '' })}
        >
          + Log session
        </button>
      </div>
      <p className="muted small">Keep sessions short: puppies do best with 3–5 minute bursts a few times a day. Log puppy-class sessions here too.</p>
      {sorted.length === 0 && <Empty>No sessions logged yet.</Empty>}
      {sorted.map((s) => (
        <article key={s.id} className="card clickable" onClick={() => setEditing(s)}>
          <div className="row-between">
            <strong>{new Date(s.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
            <span className="muted">
              {s.minutes} min · {'★'.repeat(s.rating)}
            </span>
          </div>
          {s.skillIds.length > 0 && <p className="tag">{s.skillIds.map((id) => skillName.get(id) ?? '(deleted skill)').join(', ')}</p>}
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
  const [s, setS] = useState(session);
  const toggleSkill = (id: string) =>
    setS({ ...s, skillIds: s.skillIds.includes(id) ? s.skillIds.filter((x) => x !== id) : [...s.skillIds, id] });

  return (
    <Sheet title={isNew ? 'Log training session' : 'Edit session'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          upsert('sessions', s);
          onClose();
        }}
      >
        <div className="grid-2">
          <Field label="Date">
            <input type="date" required value={s.date} onChange={(e) => setS({ ...s, date: e.target.value })} />
          </Field>
          <Field label="Minutes">
            <input type="number" min={1} inputMode="numeric" value={s.minutes} onChange={(e) => setS({ ...s, minutes: Number(e.target.value) || 1 })} />
          </Field>
        </div>
        <Field label="How did it go?">
          <select value={s.rating} onChange={(e) => setS({ ...s, rating: Number(e.target.value) })}>
            <option value={1}>★ Tough</option>
            <option value={2}>★★ Meh</option>
            <option value={3}>★★★ OK</option>
            <option value={4}>★★★★ Good</option>
            <option value={5}>★★★★★ Great</option>
          </select>
        </Field>
        <fieldset className="field">
          <legend className="field-label">Skills practised</legend>
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
        <Field label="Notes">
          <textarea rows={3} value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} placeholder="What worked, distractions, trainer feedback…" />
        </Field>
        <div className="row-between">
          {!isNew ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm('Delete this session?')) {
                  remove('sessions', s.id);
                  onClose();
                }
              }}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <button className="btn btn-primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function Social() {
  const items = useCollection('social');
  const { upsert, remove } = useStore();
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const groups = groupBy(items, (i) => i.group);
  const done = items.filter((i) => i.count >= SOCIAL_TARGET).length;

  const bump = (i: SocialItem, d: number) => upsert('social', { ...i, count: Math.max(0, i.count + d) });

  return (
    <>
      <Progress label={`Experienced ${SOCIAL_TARGET}+ times`} value={done} total={items.length} />
      <p className="muted small">
        The key socialisation window closes around 12–16 weeks. Aim for short, positive, calm exposures and tap + after each one. Ask your vet what's safe before
        vaccinations are complete.
      </p>
      {groups.map(([group, list]) => (
        <section className="card" key={group}>
          <h2>{group}</h2>
          <ul className="item-list">
            {list.map((i) => (
              <li key={i.id} className={i.count >= SOCIAL_TARGET ? 'done-soft' : ''}>
                <div className="item-main">
                  <span className="item-title static">{i.name}</span>
                  <div className="counter">
                    <button className="icon-btn" aria-label={`One less ${i.name}`} onClick={() => bump(i, -1)} disabled={i.count === 0}>
                      −
                    </button>
                    <span className="count">{i.count}</span>
                    <button className="icon-btn" aria-label={`One more ${i.name}`} onClick={() => bump(i, 1)}>
                      +
                    </button>
                    {!i.id.startsWith('seed-') && (
                      <button className="icon-btn" aria-label={`Delete ${i.name}`} onClick={() => confirm(`Delete "${i.name}"?`) && remove('social', i.id)}>
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
        <h2>Add experience</h2>
        <div className="grid-2">
          <Field label="Experience">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Skateboards" />
          </Field>
          <Field label="Group">
            <input list="social-groups" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="Sounds" />
            <datalist id="social-groups">
              {groups.map(([g]) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>
        </div>
        <button className="btn" type="submit">
          Add
        </button>
      </form>
    </>
  );
}
