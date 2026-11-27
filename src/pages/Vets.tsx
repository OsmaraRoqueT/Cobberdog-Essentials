import { useEffect, useState } from 'react';
import { Field } from '../components/ui';
import { useI18n, type MessageKey } from '../i18n';
import { uid } from '../lib/merge';
import { embedUrl, mapsPlaceLink, mapsSearchLink, placeDetails, PlacesError, PLACES_ENABLED, searchVets, type PlaceDetails, type SearchResult } from '../lib/places';
import { getProfile, PROFILE_ID, useCollection, useStore } from '../lib/store';
import type { Note, Profile, Tri } from '../types';
import { todayStr } from '../lib/health';

const RADII = [5, 10, 25, 50];

export const chosenInsurer = (notes: Note[]) => notes.find((n) => n.category === 'insurance' && n.kind === 'option' && n.decision === 'chosen');
export const insurers = (notes: Note[]) => notes.filter((n) => n.category === 'insurance' && n.kind === 'option' && n.decision !== 'rejected');

function errorKey(e: unknown): MessageKey {
  const code = e instanceof PlacesError ? e.message : 'google';
  const known = ['signin-required', 'not-configured', 'postcode-not-found', 'bad-postcode', 'offline', 'google'];
  return `vet.err.${known.includes(code) ? code : 'google'}` as MessageKey;
}

export function MapFrame({ src, title }: { src: string | null; title: string }) {
  if (!src) return null;
  return <iframe className="map" title={title} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />;
}

export function VetFinder() {
  return PLACES_ENABLED ? <PlacesFinder /> : <MapsFinder />;
}

/** Free: search in Google Maps (app or web), then add the clinics you want to compare. */
function MapsFinder() {
  const { t, lang } = useI18n();
  const { data, upsert } = useStore();
  const profile = getProfile(data);
  const [postcode, setPostcode] = useState(profile?.postcode ?? '');
  const blank = { name: '', phone: '', website: '', address: '', mapsUrl: '' };
  const [c, setC] = useState(blank);
  const [added, setAdded] = useState<string | null>(null);
  const keyword = lang === 'nb' ? 'veterinær' : 'vet';
  const pc = postcode.trim();

  const savePostcode = () => {
    if (!pc || pc === profile?.postcode) return;
    const base: Profile = profile ?? { id: PROFILE_ID, updatedAt: '', name: '', breeder: '', birthDate: '', arrivalDate: '', size: '', colour: '', microchip: '', notes: '' };
    upsert('profile', { ...base, postcode: pc });
  };
  const field = (k: keyof typeof blank) => ({ value: c[k], onChange: (e: { target: { value: string } }) => setC({ ...c, [k]: e.target.value }) });

  return (
    <section className="card form">
      <h2>🔎 {t('vet.finderTitle')}</h2>
      <p className="muted small">{t('vet.mapsIntro')}</p>
      <div className="finder-row two">
        <Field label={t('vet.postcode')}>
          <input {...{ value: postcode, onChange: (e) => setPostcode(e.target.value) }} onBlur={savePostcode} autoComplete="postal-code" placeholder="0150" />
        </Field>
        <a
          className={`btn btn-primary center align-end ${pc ? '' : 'disabled'}`}
          aria-disabled={!pc}
          href={pc ? mapsSearchLink(`${keyword} ${pc}`) : undefined}
          target="_blank"
          rel="noreferrer"
          onClick={savePostcode}
        >
          🗺️ {t('vet.openSearch')}
        </a>
      </div>

      <form
        className="form card-inset"
        onSubmit={(e) => {
          e.preventDefault();
          const name = c.name.trim();
          if (!name) return;
          upsert('notes', {
            id: uid(),
            updatedAt: '',
            kind: 'option',
            category: 'vet',
            title: name,
            provider: name,
            body: '',
            decision: 'considering',
            contact: c.phone.trim() || undefined,
            link: c.website.trim() || undefined,
            address: c.address.trim() || undefined,
            mapsUrl: c.mapsUrl.trim() || undefined,
            emergency: 'unknown',
            fearFree: 'unknown',
          });
          setAdded(name);
          setC(blank);
        }}
      >
        <h3>{t('vet.addFound')}</h3>
        <Field label={t('vet.clinicName')}>
          <input required {...field('name')} />
        </Field>
        <div className="grid-2">
          <Field label={t('vet.phone')}>
            <input type="tel" {...field('phone')} />
          </Field>
          <Field label={t('common.website')}>
            <input type="url" placeholder="https://" {...field('website')} />
          </Field>
        </div>
        <Field label={t('vet.address')}>
          <input {...field('address')} />
        </Field>
        <Field label={t('vet.mapsLink')} hint={t('vet.mapsLinkHint')}>
          <input type="url" placeholder="https://maps.app.goo.gl/…" {...field('mapsUrl')} />
        </Field>
        <button className="btn btn-primary">{t('vet.addClinic')}</button>
        {added && <p className="notice">{t('vet.added', { name: added })}</p>}
      </form>
    </section>
  );
}

/** Paid upgrade: in-app search through the "places" Edge Function. */
function PlacesFinder() {
  const { t, lang } = useI18n();
  const { data, upsert } = useStore();
  const profile = getProfile(data);
  const notes = useCollection('notes');
  const [postcode, setPostcode] = useState(profile?.postcode ?? '');
  const [radius, setRadius] = useState(10);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const evaluating = new Set(notes.filter((n) => n.placeId).map((n) => n.placeId));
  const country = profile?.country ?? 'XX';
  const keyword = lang === 'nb' ? 'veterinær' : 'vet';

  const search = async () => {
    const pc = postcode.trim();
    if (!pc) return;
    setBusy(true);
    setError(null);
    if (pc !== profile?.postcode) {
      const base: Profile = profile ?? { id: PROFILE_ID, updatedAt: '', name: '', breeder: '', birthDate: '', arrivalDate: '', size: '', colour: '', microchip: '', notes: '' };
      upsert('profile', { ...base, postcode: pc });
    }
    try {
      setResult(await searchVets(pc, country, lang, radius));
    } catch (e) {
      setResult(null);
      setError(errorKey(e));
    } finally {
      setBusy(false);
    }
  };

  const evaluate = async (p: SearchResult['places'][number]) => {
    setAdding(p.id);
    const d = await placeDetails(p.id, lang).catch(() => null);
    upsert('notes', {
      id: uid(),
      updatedAt: '',
      kind: 'option',
      category: 'vet',
      title: p.name,
      provider: p.name,
      body: '',
      decision: 'considering',
      placeId: p.id,
      address: p.address,
      distanceKm: p.distanceKm,
      link: d?.website,
      contact: d?.phone,
      emergency: 'unknown',
      fearFree: 'unknown',
    });
    setAdding(null);
  };

  return (
    <section className="card form">
      <h2>🔎 {t('vet.finderTitle')}</h2>
      <p className="muted small">{t('vet.finderIntro')}</p>
      <form
        className="finder-row"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <Field label={t('vet.postcode')}>
          <input value={postcode} onChange={(e) => setPostcode(e.target.value)} inputMode="text" autoComplete="postal-code" placeholder="0150" required />
        </Field>
        <Field label={t('vet.radius')}>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            {RADII.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </Field>
        <button className="btn btn-primary align-end" disabled={busy}>
          {busy ? t('vet.searching') : t('vet.search')}
        </button>
      </form>

      {error && <p className={error === 'vet.err.not-configured' ? 'notice' : 'error'}>{t(error)}</p>}
      {postcode.trim() && (error || !result) && (
        <a href={mapsSearchLink(`${keyword} ${postcode.trim()}`)} target="_blank" rel="noreferrer">
          {t('vet.searchInMaps', { postcode: postcode.trim() })}
        </a>
      )}

      {result && (
        <>
          <MapFrame src={embedUrl({ query: keyword, center: result.origin, zoom: radius <= 5 ? 13 : radius <= 10 ? 12 : 11 }, lang)} title={t('vet.finderTitle')} />
          <p className="muted small">{t('vet.results', { n: result.places.length, place: result.origin.label })}</p>
          {result.places.length === 0 && <p className="muted">{t('vet.noResults', { km: radius })}</p>}
          <ul className="item-list">
            {result.places.map((p) => (
              <li key={p.id}>
                <div className="item-main">
                  <div className="grow">
                    <strong>{p.name}</strong>
                    <div className="muted small">
                      {p.distanceKm != null && `${p.distanceKm.toLocaleString(lang === 'nb' ? 'nb-NO' : undefined)} km · `}
                      {p.rating != null && `★ ${p.rating.toLocaleString(lang === 'nb' ? 'nb-NO' : undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (${p.ratingCount ?? 0}) · `}
                      {p.address}
                    </div>
                    <a className="small" href={p.mapsUri ?? mapsPlaceLink(p.name, p.id)} target="_blank" rel="noreferrer">
                      {t('vet.openInMaps')}
                    </a>
                  </div>
                  {evaluating.has(p.id) ? (
                    <span className="badge badge-recommended">{t('vet.evaluating')}</span>
                  ) : (
                    <button className="btn btn-small" disabled={adding === p.id} onClick={() => void evaluate(p)}>
                      {t('vet.evaluate')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="muted tiny">Google Maps</p>
        </>
      )}
    </section>
  );
}

function TriMark({ v }: { v?: Tri }) {
  const { t } = useI18n();
  if (v === 'yes') return <span className="tri tri-yes">✓ {t('vet.yes')}</span>;
  if (v === 'no') return <span className="tri tri-no">✗ {t('vet.no')}</span>;
  return <span className="tri tri-unknown">? {t('vet.unknown')}</span>;
}

/** Deciding factors for a vet clinic, plus live Google details on demand. */
export function VetScorecard({ note }: { note: Note }) {
  const { t, lang, locale } = useI18n();
  const notes = useCollection('notes');
  const insurer = chosenInsurer(notes);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!open || !note.placeId || details) return;
    placeDetails(note.placeId, lang)
      .then(setDetails)
      .catch((e) => setError(errorKey(e)));
  }, [open, note.placeId, lang, details]);

  const insurerName = insurer ? insurer.provider || insurer.title : '';
  return (
    <div className="scorecard">
      <p className="tag">{t('vet.scorecard')}</p>
      <dl className="facts">
        <dt>💳 {insurer ? t('vet.settlement', { insurer: insurerName }) : t('vet.settlementNoInsurer')}</dt>
        <dd>{insurer ? <TriMark v={note.settlement?.[insurerName]} /> : '–'}</dd>
        <dt>📍 {t('vet.distance')}</dt>
        <dd>{note.distanceKm != null ? `${note.distanceKm.toLocaleString(locale)} km` : '–'}</dd>
        <dt>🚨 {t('vet.emergency')}</dt>
        <dd>
          <TriMark v={note.emergency} />
        </dd>
        <dt>🤝 {t('vet.fearFree')}</dt>
        <dd>
          <TriMark v={note.fearFree} />
        </dd>
        {details?.rating != null && (
          <>
            <dt>⭐ {t('vet.googleRating')}</dt>
            <dd>
              {details.rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ({details.ratingCount ?? 0})
            </dd>
          </>
        )}
        {note.address && (
          <>
            <dt>{t('vet.address')}</dt>
            <dd>{note.address}</dd>
          </>
        )}
      </dl>
      {note.checkedOn && <p className="muted small">{t('vet.checkedOn', { date: new Date(note.checkedOn + 'T12:00:00').toLocaleDateString(locale) })}</p>}
      {(!note.emergency || note.emergency === 'unknown' || !note.fearFree || note.fearFree === 'unknown' || (insurer && (note.settlement?.[insurerName] ?? 'unknown') === 'unknown')) && (
        <CallPrompt note={note} insurerName={insurerName} />
      )}
      {!note.placeId && (
        <a href={note.mapsUrl || mapsSearchLink([note.provider || note.title, note.address].filter(Boolean).join(' '))} target="_blank" rel="noreferrer">
          ⭐ {t('vet.seeReviews')}
        </a>
      )}
      {note.placeId && (
        <button className="link-btn" onClick={() => setOpen(!open)}>
          {open ? t('vet.hideReviews') : `⭐ ${t('vet.showReviews')}`}
        </button>
      )}
      {open && note.placeId && (
        <div className="live">
          {!details && !error && <p className="muted small">{t('vet.loading')}</p>}
          {error && <p className="error small">{t(error)}</p>}
          <MapFrame src={embedUrl({ placeId: note.placeId }, lang)} title={note.provider || note.title} />
          {details && (
            <>
              {details.hours.length > 0 && (
                <details>
                  <summary>{t('vet.hours')}</summary>
                  <ul className="hours">
                    {details.hours.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </details>
              )}
              <h4>{t('vet.reviewsFrom')}</h4>
              <ul className="reviews">
                {details.reviews.map((r, i) => (
                  <li key={i}>
                    <div className="row-between">
                      <span>
                        {r.authorUri ? (
                          <a href={r.authorUri} target="_blank" rel="noreferrer">
                            {r.author}
                          </a>
                        ) : (
                          r.author
                        )}
                      </span>
                      <span className="muted small">
                        {'★'.repeat(Math.round(r.rating))} · {r.when}
                      </span>
                    </div>
                    <p className="note-body small">{r.text}</p>
                  </li>
                ))}
              </ul>
              <a href={details.mapsUri ?? mapsPlaceLink(details.name, details.id)} target="_blank" rel="noreferrer">
                {t('vet.openInMaps')}
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** A phone number in free text, normalised for a tel: link. */
const phoneOf = (s?: string) => {
  const m = s?.match(/\+?[\d][\d\s().-]{5,}\d/);
  return m ? m[0].replace(/[^\d+]/g, '') : null;
};

/** "Call the clinic" with the questions that are still open. */
function CallPrompt({ note, insurerName }: { note: Note; insurerName: string }) {
  const { t } = useI18n();
  const phone = phoneOf(note.contact);
  const questions = [
    insurerName && (note.settlement?.[insurerName] ?? 'unknown') === 'unknown' ? t('vet.q.settlement', { insurer: insurerName }) : null,
    !note.emergency || note.emergency === 'unknown' ? t('vet.q.emergency') : null,
    !note.fearFree || note.fearFree === 'unknown' ? t('vet.q.fearFree') : null,
    t('vet.q.puppyPackage'),
  ].filter(Boolean) as string[];
  return (
    <div className="call">
      <div className="row-between">
        <p className="small">{t('vet.askClinic')}</p>
        {phone && (
          <a className="btn btn-small btn-ok" href={`tel:${phone}`}>
            📞 {t('vet.call')}
          </a>
        )}
      </div>
      <ol className="questions small">
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
    </div>
  );
}

const TRI: Tri[] = ['unknown', 'yes', 'no'];

function TriSelect({ value, onChange, label }: { value?: Tri; onChange: (v: Tri) => void; label: string }) {
  const { t } = useI18n();
  return (
    <Field label={label}>
      <select value={value ?? 'unknown'} onChange={(e) => onChange(e.target.value as Tri)}>
        {TRI.map((v) => (
          <option key={v} value={v}>
            {t(`vet.${v}` as MessageKey)}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Extra fields in the edit sheet for a vet clinic option. */
export function VetFields({ note, update }: { note: Note; update: (patch: Partial<Note>) => void }) {
  const set = <K extends keyof Note>(k: K, v: Note[K]) => update({ [k]: v } as Partial<Note>);
  // Answers from the clinic are stamped with today's date.
  const answer = (patch: Partial<Note>) => update({ ...patch, checkedOn: todayStr() });
  const { t } = useI18n();
  const notes = useCollection('notes');
  const list = insurers(notes).sort((a, b) => Number(b.decision === 'chosen') - Number(a.decision === 'chosen'));
  return (
    <>
      <div className="grid-2">
        <TriSelect label={`🚨 ${t('vet.emergency')}`} value={note.emergency} onChange={(v) => answer({ emergency: v })} />
        <TriSelect label={`🤝 ${t('vet.fearFree')}`} value={note.fearFree} onChange={(v) => answer({ fearFree: v })} />
      </div>
      <Field label={t('vet.address')}>
        <input value={note.address ?? ''} onChange={(e) => set('address', e.target.value)} />
      </Field>
      <div className="grid-2">
        <Field label={t('vet.mapsLink')}>
          <input type="url" value={note.mapsUrl ?? ''} onChange={(e) => set('mapsUrl', e.target.value || undefined)} placeholder="https://maps.app.goo.gl/…" />
        </Field>
        <Field label={`${t('vet.distance')} (km)`}>
          <input
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            value={note.distanceKm ?? ''}
            onChange={(e) => set('distanceKm', e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </Field>
      </div>
      {list.length > 0 && (
        <fieldset className="field">
          <legend className="field-label">💳 {t('vet.settlementPer')}</legend>
          <div className="grid-2">
            {list.map((i) => {
              const name = i.provider || i.title;
              return (
                <TriSelect
                  key={i.id}
                  label={`${name}${i.decision === 'chosen' ? ' ✓' : ''}`}
                  value={note.settlement?.[name]}
                  onChange={(v) => answer({ settlement: { ...(note.settlement ?? {}), [name]: v } })}
                />
              );
            })}
          </div>
        </fieldset>
      )}
    </>
  );
}
