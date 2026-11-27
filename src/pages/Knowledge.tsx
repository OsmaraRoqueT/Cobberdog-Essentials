import { useState } from 'react';
import { Empty, Field, Linkified, Sheet } from '../components/ui';
import { uid } from '../lib/merge';
import { useI18n, type MessageKey } from '../i18n';
import { useCollection, useStore } from '../lib/store';
import { NOTE_CATEGORIES, type Decision, type Note, type NoteCategory } from '../types';

const DECISION_ORDER: Record<Decision, number> = { chosen: 0, considering: 1, rejected: 2 };

export default function Knowledge() {
  const notes = useCollection('notes');
  const { t } = useI18n();
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
    category: cat === 'All' ? (kind === 'option' ? 'vet' : 'tips') : cat,
    kind,
    body: '',
    decision: kind === 'option' ? 'considering' : undefined,
  });

  return (
    <div className="stack">
      <div className="row-between">
        <h1>{t('kb.title')}</h1>
        <div className="row-gap">
          <button className="btn" onClick={() => setEditing(blank('option'))}>
            {t('kb.addOption')}
          </button>
          <button className="btn btn-primary" onClick={() => setEditing(blank('note'))}>
            {t('kb.addNote')}
          </button>
        </div>
      </div>
      <p className="muted small">{t('kb.intro')}</p>
      <input className="search" type="search" placeholder={t('kb.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips scroll-x" role="radiogroup" aria-label={t('common.category')}>
        {(['All', ...NOTE_CATEGORIES] as const).map((c) => (
          <button key={c} role="radio" aria-checked={cat === c} className={`chip ${cat === c ? 'chip-on' : ''}`} onClick={() => setCat(c)}>
            {c === 'All' ? t('common.all') : t(`cat.${c}` as MessageKey)}
          </button>
        ))}
      </div>

      {options.length > 0 && (
        <section>
          <h2 className="section-title">{t('kb.options')}</h2>
          <div className="stack">
            {options.map((n) => (
              <OptionCard key={n.id} note={n} onEdit={() => setEditing(n)} />
            ))}
          </div>
        </section>
      )}

      <section>
        {options.length > 0 && <h2 className="section-title">{t('kb.notes')}</h2>}
        {plain.length === 0 && options.length === 0 && <Empty>{t('kb.empty')}</Empty>}
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
  const { t } = useI18n();
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
          {t('common.edit')}
        </button>
      </div>
      <p className="tag">{t(`cat.${note.category}` as MessageKey)}</p>
      <p className="note-body">
        <Linkified text={expanded || !long ? note.body : note.body.slice(0, 220) + '…'} />
      </p>
      {long && (
        <button className="link-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? t('common.showLess') : t('common.readMore')}
        </button>
      )}
    </article>
  );
}

function OptionCard({ note, onEdit }: { note: Note; onEdit: () => void }) {
  const { t } = useI18n();
  const d = note.decision ?? 'considering';
  return (
    <article className={`card option option-${d}`}>
      <div className="row-between">
        <h3>{note.provider || note.title}</h3>
        <button className="link-btn" onClick={onEdit}>
          {t('common.edit')}
        </button>
      </div>
      <p className="tag">
        {t(`cat.${note.category}` as MessageKey)} · <span className={`decision decision-${d}`}>{t(`decision.${d}` as MessageKey)}</span>
        {note.rating ? ` · ${'★'.repeat(note.rating)}${'☆'.repeat(5 - note.rating)}` : ''}
      </p>
      {note.provider && note.title && note.title !== note.provider && <p className="muted small">{note.title}</p>}
      <dl className="facts">
        {note.cost && (
          <>
            <dt>{t('common.cost')}</dt>
            <dd>{note.cost}</dd>
          </>
        )}
        {note.contact && (
          <>
            <dt>{t('common.contact')}</dt>
            <dd>
              <Linkified text={note.contact} />
            </dd>
          </>
        )}
        {note.pros && (
          <>
            <dt>{t('kb.pros')}</dt>
            <dd className="pre">{note.pros}</dd>
          </>
        )}
        {note.cons && (
          <>
            <dt>{t('kb.cons')}</dt>
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
          {t('common.website')} ↗
        </a>
      )}
    </article>
  );
}

function NoteSheet({ note, isNew, onClose }: { note: Note; isNew: boolean; onClose: () => void }) {
  const { upsert, remove } = useStore();
  const { t } = useI18n();
  const [n, setN] = useState<Note>(note);
  const set = <K extends keyof Note>(k: K, v: Note[K]) => setN({ ...n, [k]: v });
  const isOption = n.kind === 'option';

  return (
    <Sheet title={isOption ? t(isNew ? 'kb.addOptionTitle' : 'kb.editOptionTitle') : t(isNew ? 'kb.addNoteTitle' : 'kb.editNoteTitle')} onClose={onClose}>
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
        <Field label={t('common.category')}>
          <select value={n.category} onChange={(e) => set('category', e.target.value as NoteCategory)}>
            {NOTE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`cat.${c}` as MessageKey)}
              </option>
            ))}
          </select>
        </Field>
        {isOption && (
          <Field label={t('kb.providerName')}>
            <input value={n.provider ?? ''} onChange={(e) => set('provider', e.target.value)} autoFocus />
          </Field>
        )}
        <Field label={isOption ? t('kb.shortDesc') : t('kb.noteTitle')}>
          <input value={n.title} onChange={(e) => set('title', e.target.value)} required={!isOption} autoFocus={!isOption} />
        </Field>
        {isOption && (
          <>
            <div className="grid-2">
              <Field label={t('kb.decision')}>
                <select value={n.decision ?? 'considering'} onChange={(e) => set('decision', e.target.value as Decision)}>
                  <option value="considering">{t('decision.considering')}</option>
                  <option value="chosen">{t('decision.chosen')}</option>
                  <option value="rejected">{t('decision.rejected')}</option>
                </select>
              </Field>
              <Field label={t('common.rating')}>
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
              <Field label={t('common.cost')}>
                <input value={n.cost ?? ''} onChange={(e) => set('cost', e.target.value)} placeholder={t('kb.costPlaceholder')} />
              </Field>
              <Field label={t('common.contact')}>
                <input value={n.contact ?? ''} onChange={(e) => set('contact', e.target.value)} placeholder={t('kb.contactPlaceholder')} />
              </Field>
            </div>
            <Field label={t('common.website')}>
              <input type="url" value={n.link ?? ''} onChange={(e) => set('link', e.target.value)} placeholder="https://" />
            </Field>
            <Field label={t('kb.pros')}>
              <textarea rows={3} value={n.pros ?? ''} onChange={(e) => set('pros', e.target.value)} />
            </Field>
            <Field label={t('kb.cons')}>
              <textarea rows={3} value={n.cons ?? ''} onChange={(e) => set('cons', e.target.value)} />
            </Field>
          </>
        )}
        <Field label={isOption ? t('common.notes') : t('kb.content')} hint={t('kb.linksHint')}>
          <textarea rows={isOption ? 3 : 8} value={n.body} onChange={(e) => set('body', e.target.value)} />
        </Field>
        {!isOption && (
          <label className="inline-check">
            <input type="checkbox" checked={Boolean(n.pinned)} onChange={(e) => set('pinned', e.target.checked)} /> {t('kb.pin')}
          </label>
        )}
        <div className="row-between">
          {!isNew ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(t('common.confirmDeleteEntry'))) {
                  remove('notes', n.id);
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
