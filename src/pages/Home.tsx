import { useState } from 'react';
import type { TabId } from '../App';
import { Field, Progress, Sheet } from '../components/ui';
import { useCollection, useStore } from '../lib/store';
import type { Profile } from '../types';

const PROFILE_ID = 'puppy';

function daysUntil(date: string): number | null {
  if (!date) return null;
  const ms = new Date(date + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(ms / 86_400_000);
}

function ageText(birth: string): string | null {
  if (!birth) return null;
  const days = Math.floor((Date.now() - new Date(birth + 'T00:00:00').getTime()) / 86_400_000);
  if (days < 0) return 'not born yet';
  const weeks = Math.floor(days / 7);
  return weeks < 26 ? `${weeks} weeks old` : `${Math.floor(days / 30.44)} months old`;
}

export default function Home({ go }: { go: (t: TabId) => void }) {
  const { upsert } = useStore();
  const profile = useCollection('profile').find((p) => p.id === PROFILE_ID);
  const shopping = useCollection('shopping');
  const notes = useCollection('notes');
  const skills = useCollection('skills');
  const [editing, setEditing] = useState(false);

  const active = shopping.filter((s) => s.status !== 'skip');
  const essentials = active.filter((s) => s.priority === 'essential');
  const bought = active.filter((s) => s.status === 'bought');
  const nextUp = essentials.filter((s) => s.status === 'todo').slice(0, 5);
  const spent = shopping.reduce((sum, s) => sum + (s.status === 'bought' ? s.cost ?? 0 : 0), 0);
  const chosen = (cat: string) => notes.find((n) => n.category === cat && n.kind === 'option' && n.decision === 'chosen');
  const vet = chosen('Vet');
  const course = chosen('Training course');
  const reliable = skills.filter((s) => s.status === 'reliable').length;

  const until = daysUntil(profile?.arrivalDate ?? '');
  const name = profile?.name || 'your puppy';

  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <h1>{profile?.name ? `${profile.name} 🐶` : 'Welcome!'}</h1>
          <p className="muted">
            {until === null
              ? 'Add your puppy and pickup date to start the countdown.'
              : until > 0
                ? `${until} day${until === 1 ? '' : 's'} until ${name} comes home`
                : until === 0
                  ? `Pickup day! 🎉`
                  : `Home for ${-until} day${until === -1 ? '' : 's'}`}
            {profile?.birthDate && ` · ${ageText(profile.birthDate)}`}
          </p>
        </div>
        <button className="btn" onClick={() => setEditing(true)}>
          {profile ? 'Edit' : 'Add puppy'}
        </button>
      </section>

      <section className="card">
        <h2>Getting ready</h2>
        <Progress label="Essentials bought" value={essentials.filter((s) => s.status === 'bought').length} total={essentials.length} />
        <Progress label="Whole shopping list" value={bought.length} total={active.length} />
        <Progress label="Skills reliable" value={reliable} total={skills.length} />
        {spent > 0 && <p className="muted small">Spent so far: {spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
      </section>

      <section className="card">
        <h2>Key decisions</h2>
        <ul className="plain-list">
          <li>
            <span>🩺 Vet</span>
            <button className="link-btn" onClick={() => go('knowledge')}>
              {vet ? vet.provider || vet.title : 'Not chosen yet →'}
            </button>
          </li>
          <li>
            <span>🎓 Training course</span>
            <button className="link-btn" onClick={() => go('knowledge')}>
              {course ? course.provider || course.title : 'Not chosen yet →'}
            </button>
          </li>
        </ul>
      </section>

      <section className="card">
        <div className="row-between">
          <h2>Next essentials to buy</h2>
          <button className="link-btn" onClick={() => go('shopping')}>
            All →
          </button>
        </div>
        {nextUp.length === 0 ? (
          <p className="muted">All essentials covered. 🎉</p>
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

function ProfileSheet({ profile, onClose }: { profile?: Profile; onClose: () => void }) {
  const { upsert } = useStore();
  const [p, setP] = useState<Profile>(
    profile ?? { id: PROFILE_ID, updatedAt: '', name: '', breeder: '', birthDate: '', arrivalDate: '', size: '', colour: '', microchip: '', notes: '' },
  );
  const set = (k: keyof Profile) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value });
  return (
    <Sheet title="Puppy profile" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          upsert('profile', p);
          onClose();
        }}
      >
        <Field label="Name">
          <input value={p.name} onChange={set('name')} placeholder="e.g. Biscuit" />
        </Field>
        <div className="grid-2">
          <Field label="Date of birth">
            <input type="date" value={p.birthDate} onChange={set('birthDate')} />
          </Field>
          <Field label="Pickup / arrival date">
            <input type="date" value={p.arrivalDate} onChange={set('arrivalDate')} />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Size">
            <select value={p.size} onChange={set('size')}>
              <option value="">—</option>
              <option>Miniature</option>
              <option>Medium</option>
              <option>Standard</option>
            </select>
          </Field>
          <Field label="Colour">
            <input value={p.colour} onChange={set('colour')} placeholder="e.g. Caramel" />
          </Field>
        </div>
        <Field label="Breeder">
          <input value={p.breeder} onChange={set('breeder')} />
        </Field>
        <Field label="Microchip number">
          <input value={p.microchip} onChange={set('microchip')} inputMode="numeric" />
        </Field>
        <Field label="Notes">
          <textarea rows={3} value={p.notes} onChange={set('notes')} />
        </Field>
        <button className="btn btn-primary" type="submit">
          Save
        </button>
      </form>
    </Sheet>
  );
}
