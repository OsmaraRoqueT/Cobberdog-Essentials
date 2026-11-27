import { useMemo, useState } from 'react';
import { Chips, Empty, Field, groupBy, Sheet } from '../components/ui';
import { uid } from '../lib/merge';
import { useI18n } from '../i18n';
import { useCollection, useStore } from '../lib/store';
import type { Priority, ShoppingItem, ShoppingStatus } from '../types';
import type { MessageKey } from '../i18n';

type Filter = 'todo' | 'bought' | 'all';
const PRIORITY_ORDER: Record<Priority, number> = { essential: 0, recommended: 1, nice: 2 };

export default function Shopping() {
  const items = useCollection('shopping');
  const { upsert } = useStore();
  const { t } = useI18n();
  const FILTERS = [
    { value: 'todo', label: t('shop.todo') },
    { value: 'bought', label: t('shop.bought') },
    { value: 'all', label: t('common.all') },
  ] as const;
  const [filter, setFilter] = useState<Filter>('todo');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<ShoppingItem | 'new' | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const visible = items
    .filter((i) => (filter === 'all' ? true : filter === 'todo' ? i.status === 'todo' : i.status === 'bought'))
    .filter((i) => !q || `${i.name} ${i.tip ?? ''} ${i.notes ?? ''} ${i.store ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.name.localeCompare(b.name));

  const toggle = (i: ShoppingItem) => upsert('shopping', { ...i, status: i.status === 'bought' ? 'todo' : 'bought' });

  return (
    <div className="stack">
      <div className="row-between">
        <h1>{t('shop.title')}</h1>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + {t('common.add')}
        </button>
      </div>
      <input className="search" type="search" placeholder={t('shop.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <Chips label={t('common.status')} options={FILTERS} value={filter} onChange={setFilter} />

      {visible.length === 0 && <Empty>{filter === 'todo' ? t('shop.nothingLeft') : t('shop.noMatch')}</Empty>}

      {groupBy(visible, (i) => i.category).map(([cat, list]) => (
        <section key={cat} className="card">
          <h2>{cat}</h2>
          <ul className="item-list">
            {list.map((i) => (
              <li key={i.id} className={i.status === 'bought' ? 'done' : i.status === 'skip' ? 'skipped' : ''}>
                <div className="item-main">
                  <input type="checkbox" aria-label={`${t('shop.bought')}: ${i.name}`} checked={i.status === 'bought'} onChange={() => toggle(i)} />
                  <button className="item-title" onClick={() => setOpen(open === i.id ? null : i.id)}>
                    {i.name}
                  </button>
                  <span className={`badge badge-${i.priority}`}>{t(`prio.${i.priority}` as MessageKey)}</span>
                </div>
                {open === i.id && (
                  <div className="item-detail">
                    {i.tip && <p>💡 {i.tip}</p>}
                    {i.notes && <p>📝 {i.notes}</p>}
                    {(i.store || i.cost != null) && (
                      <p className="muted">
                        {i.store}
                        {i.store && i.cost != null && ' · '}
                        {i.cost != null && i.cost.toFixed(2)}
                      </p>
                    )}
                    {i.link && (
                      <p>
                        <a href={i.link} target="_blank" rel="noreferrer">
                          {t('shop.productLink')}
                        </a>
                      </p>
                    )}
                    <div className="row-gap">
                      <button className="btn btn-small" onClick={() => setEditing(i)}>
                        {t('common.edit')}
                      </button>
                      <button
                        className="btn btn-small"
                        onClick={() => upsert('shopping', { ...i, status: i.status === 'skip' ? 'todo' : 'skip' })}
                      >
                        {i.status === 'skip' ? t('shop.unskip') : t('shop.skip')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {editing && (
        <ItemSheet item={editing === 'new' ? undefined : editing} categories={categories} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function ItemSheet({ item, categories, onClose }: { item?: ShoppingItem; categories: string[]; onClose: () => void }) {
  const { upsert, remove } = useStore();
  const { t } = useI18n();
  const [it, setIt] = useState<ShoppingItem>(
    item ?? { id: uid(), updatedAt: '', name: '', category: categories[0] ?? 'Other', priority: 'recommended', status: 'todo' },
  );
  const set = <K extends keyof ShoppingItem>(k: K, v: ShoppingItem[K]) => setIt({ ...it, [k]: v });

  return (
    <Sheet title={item ? t('shop.editItem') : t('shop.addItem')} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!it.name.trim()) return;
          upsert('shopping', { ...it, name: it.name.trim(), category: it.category.trim() || 'Other' });
          onClose();
        }}
      >
        <Field label={t('shop.item')}>
          <input required value={it.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        </Field>
        <div className="grid-2">
          <Field label={t('common.category')}>
            <input list="shop-cats" value={it.category} onChange={(e) => set('category', e.target.value)} />
            <datalist id="shop-cats">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label={t('common.priority')}>
            <select value={it.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              <option value="essential">{t('prio.essential')}</option>
              <option value="recommended">{t('prio.recommended')}</option>
              <option value="nice">{t('prio.nice')}</option>
            </select>
          </Field>
        </div>
        <div className="grid-2">
          <Field label={t('common.status')}>
            <select value={it.status} onChange={(e) => set('status', e.target.value as ShoppingStatus)}>
              <option value="todo">{t('shop.todo')}</option>
              <option value="bought">{t('shop.bought')}</option>
              <option value="skip">{t('shop.skip')}</option>
            </select>
          </Field>
          <Field label={t('common.cost')}>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={it.cost ?? ''}
              onChange={(e) => set('cost', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label={t('common.store')}>
          <input value={it.store ?? ''} onChange={(e) => set('store', e.target.value)} />
        </Field>
        <Field label={t('common.link')}>
          <input type="url" value={it.link ?? ''} onChange={(e) => set('link', e.target.value)} placeholder="https://" />
        </Field>
        <Field label={t('shop.tip')}>
          <textarea rows={2} value={it.tip ?? ''} onChange={(e) => set('tip', e.target.value)} />
        </Field>
        <Field label={t('common.myNotes')}>
          <textarea rows={2} value={it.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder={t('shop.notesPlaceholder')} />
        </Field>
        <div className="row-between">
          {item ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm(t('common.confirmDelete', { name: it.name }))) {
                  remove('shopping', it.id);
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
