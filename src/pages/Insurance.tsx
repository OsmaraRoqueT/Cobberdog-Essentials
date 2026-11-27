import { useState } from 'react';
import { Field, Sheet } from '../components/ui';
import { countryName } from '../content/countries';
import { INSURANCE_CRITERIA, type Criterion } from '../content/insurance';
import { pick, useI18n } from '../i18n';
import { uid } from '../lib/merge';
import { getProfile, useCollection, useStore } from '../lib/store';
import type { Decision, Note } from '../types';

const ORDER: Record<Decision, number> = { chosen: 0, considering: 1, rejected: 2 };

function Cell({ c, v }: { c: Criterion; v?: string }) {
  const { t } = useI18n();
  if (!v) return <span className="muted">{t('ins.notChecked')}</span>;
  if (c.kind === 'yesno') return v === 'yes' ? <span className="tri tri-yes">✓</span> : <span className="tri tri-no">✗</span>;
  return <span>{v}</span>;
}

export function InsuranceCompare() {
  const { t, lang } = useI18n();
  const { data, upsert } = useStore();
  const profile = getProfile(data);
  const notes = useCollection('notes');
  const [editing, setEditing] = useState<Note | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const all = notes
    .filter((n) => n.category === 'insurance' && n.kind === 'option')
    .sort((a, b) => ORDER[a.decision ?? 'considering'] - ORDER[b.decision ?? 'considering'] || (a.provider ?? a.title).localeCompare(b.provider ?? b.title));
  const rejected = all.filter((n) => n.decision === 'rejected').length;
  const cols = showRejected ? all : all.filter((n) => n.decision !== 'rejected');

  const choose = (n: Note) => {
    for (const other of all) if (other.decision === 'chosen' && other.id !== n.id) upsert('notes', { ...other, decision: 'considering' });
    upsert('notes', { ...n, decision: 'chosen' });
  };

  return (
    <section className="card form">
      <div className="row-between">
        <h2>🛡️ {t('ins.compareTitle')}</h2>
        <button
          className="btn btn-small"
          onClick={() => setEditing({ id: uid(), updatedAt: '', kind: 'option', category: 'insurance', title: '', provider: '', body: '', decision: 'considering', answers: {} })}
        >
          {t('ins.addInsurer')}
        </button>
      </div>
      <p className="muted small">{t('ins.compareIntro', { country: countryName(profile?.country ?? 'XX', lang) })}</p>
      <div className="table-wrap">
        <table className="compare">
          <thead>
            <tr>
              <th scope="col">{t('ins.criterion')}</th>
              {cols.map((n) => (
                <th key={n.id} scope="col" className={n.decision === 'chosen' ? 'col-chosen' : n.decision === 'rejected' ? 'col-rejected' : ''}>
                  <div className="col-head">
                    {n.link ? (
                      <a href={n.link} target="_blank" rel="noreferrer">
                        {n.provider || n.title}
                      </a>
                    ) : (
                      <span>{n.provider || n.title}</span>
                    )}
                    {n.decision === 'chosen' ? (
                      <span className="badge badge-recommended">{t('ins.chosen')}</span>
                    ) : (
                      <button className="btn btn-small" onClick={() => choose(n)}>
                        {t('ins.choose')}
                      </button>
                    )}
                    <button className="link-btn small" onClick={() => setEditing(n)}>
                      {t('ins.edit')}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INSURANCE_CRITERIA.map((c) => (
              <tr key={c.id}>
                <th scope="row">{pick(c.label, lang)}</th>
                {cols.map((n) => (
                  <td key={n.id} className={n.decision === 'chosen' ? 'col-chosen' : ''} onClick={() => setEditing(n)}>
                    <Cell c={c} v={n.answers?.[c.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rejected > 0 && (
        <button className="link-btn" onClick={() => setShowRejected(!showRejected)}>
          {showRejected ? t('ins.hideRuledOut') : t('ins.showRuledOut', { n: rejected })}
        </button>
      )}
      <p className="muted small">{t('ins.neutral')}</p>
      {editing && <InsurerSheet note={editing} isNew={!all.some((n) => n.id === editing.id)} onClose={() => setEditing(null)} />}
    </section>
  );
}

function InsurerSheet({ note, isNew, onClose }: { note: Note; isNew: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { upsert, remove } = useStore();
  const [n, setN] = useState<Note>({ ...note, answers: { ...(note.answers ?? {}) } });
  const setAnswer = (id: string, v: string) => setN({ ...n, answers: { ...n.answers, [id]: v } });
  const name = n.provider || n.title;

  return (
    <Sheet title={isNew ? t('ins.addInsurer').replace('+ ', '') : t('ins.sheetTitle', { name })} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const provider = (n.provider || n.title).trim();
          if (!provider) return;
          upsert('notes', { ...n, provider, title: provider });
          onClose();
        }}
      >
        {isNew && (
          <Field label={t('kb.providerName')}>
            <input required value={n.provider ?? ''} onChange={(e) => setN({ ...n, provider: e.target.value })} autoFocus />
          </Field>
        )}
        <div className="grid-2">
          <Field label={t('kb.decision')}>
            <select value={n.decision ?? 'considering'} onChange={(e) => setN({ ...n, decision: e.target.value as Decision })}>
              <option value="considering">{t('decision.considering')}</option>
              <option value="chosen">{t('decision.chosen')}</option>
              <option value="rejected">{t('decision.rejected')}</option>
            </select>
          </Field>
          <Field label={t('common.website')}>
            <input type="url" value={n.link ?? ''} onChange={(e) => setN({ ...n, link: e.target.value })} placeholder="https://" />
          </Field>
        </div>
        {INSURANCE_CRITERIA.map((c) => (
          <Field key={c.id} label={pick(c.label, lang)} hint={c.hint && pick(c.hint, lang)}>
            {c.kind === 'yesno' ? (
              <select value={n.answers?.[c.id] ?? ''} onChange={(e) => setAnswer(c.id, e.target.value)}>
                <option value="">{t('vet.unknown')}</option>
                <option value="yes">{t('vet.yes')}</option>
                <option value="no">{t('vet.no')}</option>
              </select>
            ) : (
              <input
                value={n.answers?.[c.id] ?? ''}
                onChange={(e) => setAnswer(c.id, e.target.value)}
                inputMode={c.kind === 'money' ? 'decimal' : undefined}
              />
            )}
          </Field>
        ))}
        <Field label={t('common.notes')}>
          <textarea rows={3} value={n.body} onChange={(e) => setN({ ...n, body: e.target.value })} />
        </Field>
        <div className="row-between">
          {!isNew ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(t('common.confirmDelete', { name }))) {
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
