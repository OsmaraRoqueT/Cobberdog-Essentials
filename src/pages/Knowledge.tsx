import { useState } from 'react';
import { Empty, Field, Linkified, Sheet } from '../components/ui';
import { uid } from '../lib/merge';
import { useCollection, useStore } from '../lib/store';
import { NOTE_CATEGORIES, type Decision, type Note, type NoteCategory } from '../types';

const DECISION_LABEL: Record<Decision, string> = { considering: 'Considering', chosen: 'Chosen ✓', rejected: 'Ruled out' };
const DECISION_ORDER: Record<Decision, number> = { chosen: 0, considering: 1, rejected: 2 };

export default function Knowledge() {
  const notes = useCollection('notes');
  const [cat, setCat] = useState<NoteCategory | 'All'>('All');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);

  const matches = notes
    .filter((n) => cat === 'All' || n.category === cat)
    .filter((n) => {
      if (!q) return true;
      const hay = [n.title, n.body, n.provider, n.pros, n.cons, n.contact].join(' ').toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  const options = matches
    .filter((n) => n.kind === 'option')
    .sort((a, b) => DECISION_ORDER[a.decision ?? 'considering'] - DECISION_ORDER[b.decision ?? 'considering'] || (b.rating ?? 0) - (a.rating ?? 0));
  const plain = matches
    .filter((n) => n.kind === 'note')
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.updatedAt.localeCompare(a.updatedAt));

  const blank = (kind: Note['kind']): Note => ({
    id: uid(),
    updatedAt: '',
    title: '',
    category: cat === 'All' ? (kind === 'option' ? 'Vet' : 'Tips') : cat,
    kind,
    body: '',
    decision: kind === 'option' ? 'considering' : undefined,
  });

  return (
    <div className="stack">
      <div className="row-between">
        <h1>Knowledge base</h1>
        <div className="row-gap">
          <button className="btn" onClick={() => setEditing(blank('option'))}>
            + Option
          </button>
          <button className="btn btn-primary" onClick={() => setEditing(blank('note'))}>
            + Note
          </button>
        </div>
      </div>
      <p className="muted small">
        Notes hold research and tips. <strong>Options</strong> are vets, courses, groomers or insurers you're comparing. Mark one as Chosen.
      </p>
      <input className="search" type="search" placeholder="Search everything…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips scroll-x" role="radiogroup" aria-label="Category">
        {(['All', ...NOTE_CATEGORIES] as const).map((c) => (
          <button key={c} role="radio" aria-checked={cat === c} className={`chip ${cat === c ? 'chip-on' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {options.length > 0 && (
        <section>
          <h2 className="section-title">Options being compared</h2>
          <div className="stack">
            {options.map((n) => (
              <OptionCard key={n.id} note={n} onEdit={() => setEditing(n)} />
            ))}
          </div>
        </section>
      )}

      <section>
        {options.length > 0 && <h2 className="section-title">Notes</h2>}
        {plain.length === 0 && options.length === 0 && <Empty>Nothing here yet. Add a note or an option.</Empty>}
        <div className="stack">
          {plain.map((n) => (
            <NoteCard key={n.id} note={n} onEdit={() => setEditing(n)} />
          ))}
        </div>
      </section>

      {editing && <NoteSheet note={editing} isNew={!notes.some((n) => n.id === editing.id)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function NoteCard({ note, onEdit }: { note: Note; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const long = note.body.length > 220;
  return (
    <article className="card">
      <div className="row-between">
        <h3>
          {note.pinned && '📌 '}
          {note.title}
        </h3>
        <button className="link-btn" onClick={onEdit}>
          Edit
        </button>
      </div>
      <p className="tag">{note.category}</p>
      <p className="note-body">
        <Linkified text={expanded || !long ? note.body : note.body.slice(0, 220) + '…'} />
      </p>
      {long && (
        <button className="link-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </article>
  );
}

function OptionCard({ note, onEdit }: { note: Note; onEdit: () => void }) {
  const d = note.decision ?? 'considering';
  return (
    <article className={`card option option-${d}`}>
      <div className="row-between">
        <h3>{note.provider || note.title}</h3>
        <button className="link-btn" onClick={onEdit}>
          Edit
        </button>
      </div>
      <p className="tag">
        {note.category} · <span className={`decision decision-${d}`}>{DECISION_LABEL[d]}</span>
        {note.rating ? ` · ${'★'.repeat(note.rating)}${'☆'.repeat(5 - note.rating)}` : ''}
      </p>
      {note.provider && note.title && note.title !== note.provider && <p className="muted small">{note.title}</p>}
      <dl className="facts">
        {note.cost && (
          <>
            <dt>Cost</dt>
            <dd>{note.cost}</dd>
          </>
        )}
        {note.contact && (
          <>
            <dt>Contact</dt>
            <dd>
              <Linkified text={note.contact} />
            </dd>
          </>
        )}
        {note.pros && (
          <>
            <dt>Pros</dt>
            <dd className="pre">{note.pros}</dd>
          </>
        )}
        {note.cons && (
          <>
            <dt>Cons</dt>
            <dd className="pre">{note.cons}</dd>
          </>
        )}
      </dl>
      {note.body && (
        <p className="note-body">
          <Linkified text={note.body} />
        </p>
      )}
      {note.link && (
        <a href={note.link} target="_blank" rel="noreferrer">
          Website ↗
        </a>
      )}
    </article>
  );
}

function NoteSheet({ note, isNew, onClose }: { note: Note; isNew: boolean; onClose: () => void }) {
  const { upsert, remove } = useStore();
  const [n, setN] = useState<Note>(note);
  const set = <K extends keyof Note>(k: K, v: Note[K]) => setN({ ...n, [k]: v });
  const isOption = n.kind === 'option';

  return (
    <Sheet title={`${isNew ? 'Add' : 'Edit'} ${isOption ? 'option' : 'note'}`} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const title = n.title.trim() || n.provider?.trim() || '';
          if (!title) return;
          upsert('notes', { ...n, title });
          onClose();
        }}
      >
        <Field label="Category">
          <select value={n.category} onChange={(e) => set('category', e.target.value as NoteCategory)}>
            {NOTE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        {isOption && (
          <Field label="Name (clinic, school, groomer…)">
            <input value={n.provider ?? ''} onChange={(e) => set('provider', e.target.value)} autoFocus />
          </Field>
        )}
        <Field label={isOption ? 'Short description (optional)' : 'Title'}>
          <input value={n.title} onChange={(e) => set('title', e.target.value)} required={!isOption} autoFocus={!isOption} />
        </Field>
        {isOption && (
          <>
            <div className="grid-2">
              <Field label="Decision">
                <select value={n.decision ?? 'considering'} onChange={(e) => set('decision', e.target.value as Decision)}>
                  <option value="considering">Considering</option>
                  <option value="chosen">Chosen</option>
                  <option value="rejected">Ruled out</option>
                </select>
              </Field>
              <Field label="Rating">
                <select value={n.rating ?? 0} onChange={(e) => set('rating', Number(e.target.value) || undefined)}>
                  <option value={0}>—</option>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {'★'.repeat(r)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Cost">
                <input value={n.cost ?? ''} onChange={(e) => set('cost', e.target.value)} placeholder="e.g. 6 weeks for 320" />
              </Field>
              <Field label="Contact">
                <input value={n.contact ?? ''} onChange={(e) => set('contact', e.target.value)} placeholder="Phone, address" />
              </Field>
            </div>
            <Field label="Website">
              <input type="url" value={n.link ?? ''} onChange={(e) => set('link', e.target.value)} placeholder="https://" />
            </Field>
            <Field label="Pros">
              <textarea rows={3} value={n.pros ?? ''} onChange={(e) => set('pros', e.target.value)} />
            </Field>
            <Field label="Cons">
              <textarea rows={3} value={n.cons ?? ''} onChange={(e) => set('cons', e.target.value)} />
            </Field>
          </>
        )}
        <Field label={isOption ? 'Notes' : 'Content'} hint="Paste links too. They become clickable.">
          <textarea rows={isOption ? 3 : 8} value={n.body} onChange={(e) => set('body', e.target.value)} />
        </Field>
        {!isOption && (
          <label className="inline-check">
            <input type="checkbox" checked={Boolean(n.pinned)} onChange={(e) => set('pinned', e.target.checked)} /> Pin to top
          </label>
        )}
        <div className="row-between">
          {!isNew ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm('Delete this entry?')) {
                  remove('notes', n.id);
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
