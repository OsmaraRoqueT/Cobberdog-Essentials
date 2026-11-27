import { useEffect, useRef, useState } from 'react';
import { Chips, Field } from '../components/ui';
import { buildSeed } from '../content';
import { BREEDS } from '../content/breeds';
import { COUNTRIES, countryByCode, countryName, CURRENCIES } from '../content/countries';
import { LANGS, pick, useI18n, type Lang } from '../i18n';
import { mergeRecords } from '../lib/merge';
import { getProfile, PROFILE_ID, useStore } from '../lib/store';
import * as sync from '../lib/sync';
import { COLLECTION_NAMES, type Base, type Collections, type Profile } from '../types';

export default function Settings() {
  const { t } = useI18n();
  return (
    <div className="dash">
      <h1 className="span-2">{t('settings.title')}</h1>
      <GeneralCard />
      <SyncCard />
      <BackupCard />
      <p className="muted small span-2">{t('common.vetDisclaimer')}</p>
    </div>
  );
}

const WAKE_KEY = 'cobberdog:keep-awake';

/** Screen Wake Lock for a dedicated kitchen/wall tablet. Re-acquired when the tab becomes visible again. */
function useKeepAwake(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = () =>
      navigator.wakeLock
        .request('screen')
        .then((l) => (lock = l))
        .catch(() => undefined);
    const onVisible = () => document.visibilityState === 'visible' && void acquire();
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [enabled]);
}

const readAwake = () => {
  try {
    return localStorage.getItem(WAKE_KEY) === '1';
  } catch {
    return false;
  }
};

/** Mounted once at app level so the screen stays on whichever tab is showing. */
export function KeepAwake() {
  const [on, setOn] = useState(readAwake);
  useEffect(() => {
    const onChange = () => setOn(readAwake());
    window.addEventListener('keep-awake-change', onChange);
    return () => window.removeEventListener('keep-awake-change', onChange);
  }, []);
  useKeepAwake(on);
  return null;
}

function GeneralCard() {
  const { t, lang, setLang } = useI18n();
  const { data, upsert } = useStore();
  const profile = getProfile(data);
  const [awake, setAwake] = useState(readAwake);
  const supported = 'wakeLock' in navigator;

  const update = (patch: Partial<Profile>) => {
    const base: Profile = profile ?? {
      id: PROFILE_ID,
      updatedAt: '',
      name: '',
      breeder: '',
      birthDate: '',
      arrivalDate: '',
      size: '',
      colour: '',
      microchip: '',
      notes: '',
    };
    upsert('profile', { ...base, ...patch });
  };

  return (
    <section className="card form">
      <h2>{t('settings.general')}</h2>
      <Field label={t('settings.language')}>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid-2">
        <Field label={t('settings.country')}>
          <select
            value={profile?.country ?? 'XX'}
            onChange={(e) => update({ country: e.target.value, currency: countryByCode(e.target.value).currency })}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryName(c.code, lang)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('settings.currency')}>
          <select value={profile?.currency ?? countryByCode(profile?.country).currency} onChange={(e) => update({ currency: e.target.value })}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t('settings.breed')}>
        <select value={profile?.breed ?? 'other'} onChange={(e) => update({ breed: e.target.value })}>
          {BREEDS.map((b) => (
            <option key={b.id} value={b.id}>
              {pick(b.name, lang)}
            </option>
          ))}
        </select>
      </Field>
      <label className="inline-check">
        <input
          type="checkbox"
          checked={awake}
          disabled={!supported}
          onChange={(e) => {
            setAwake(e.target.checked);
            try {
              localStorage.setItem(WAKE_KEY, e.target.checked ? '1' : '0');
            } catch {
              /* ignore */
            }
            window.dispatchEvent(new Event('keep-awake-change'));
          }}
        />
        <span>{t('settings.keepAwake')}</span>
      </label>
      {!supported && <p className="muted small">{t('settings.keepAwakeUnsupported')}</p>}
    </section>
  );
}

function SyncCard() {
  const { t } = useI18n();
  const { syncStatus, syncError, household, userEmail, syncNow, refreshSync, setHousehold } = useStore();
  const cfg = sync.getSyncConfig();
  const [url, setUrl] = useState(cfg?.url ?? '');
  const [key, setKey] = useState(cfg?.anonKey ?? '');
  const [hhName, setHhName] = useState(t('settings.householdDefault'));
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card form">
      <h2>{t('settings.syncTitle')}</h2>
      <p className="muted small">{t('settings.syncIntro')}</p>

      {!cfg && (
        <>
          <p className="small">{t('settings.syncStep1')}</p>
          <Field label={t('settings.supabaseUrl')}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xyz.supabase.co" />
          </Field>
          <Field label={t('settings.supabaseKey')}>
            <input value={key} onChange={(e) => setKey(e.target.value)} />
          </Field>
          <button
            className="btn btn-primary"
            disabled={!url || !key}
            onClick={() => {
              sync.saveSyncConfig({ url: url.trim(), anonKey: key.trim() });
              window.location.reload();
            }}
          >
            {t('settings.connect')}
          </button>
        </>
      )}

      {cfg && syncStatus === 'signed-out' && <AuthForm />}

      {cfg && userEmail && sync.isRecovery() && <NewPasswordForm />}

      {cfg && syncStatus === 'no-household' && (
        <>
          <p className="small">{t('settings.signedInAs', { email: userEmail ?? '' })}</p>
          <div className="grid-2">
            <Field label={t('settings.newHousehold')}>
              <input value={hhName} onChange={(e) => setHhName(e.target.value)} />
            </Field>
            <button className="btn btn-primary align-end" disabled={busy || !hhName} onClick={() => run(async () => setHousehold(await sync.createHousehold(hhName)))}>
              {t('settings.create')}
            </button>
          </div>
          <div className="grid-2">
            <Field label={t('settings.joinCode')}>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="3FA9C21B" />
            </Field>
            <button className="btn align-end" disabled={busy || !code} onClick={() => run(async () => setHousehold(await sync.joinHousehold(code)))}>
              {t('settings.join')}
            </button>
          </div>
        </>
      )}

      {cfg && household && userEmail && (
        <>
          <dl className="facts">
            <dt>{t('settings.household')}</dt>
            <dd>{household.name}</dd>
            <dt>{t('settings.joinCode')}</dt>
            <dd>
              <code className="big-code">{household.join_code}</code>
            </dd>
            <dt>{t('settings.signedIn')}</dt>
            <dd>{userEmail}</dd>
          </dl>
          <p className="muted small">{t('settings.shareCode')}</p>
          <div className="row-gap">
            <button className="btn btn-primary" disabled={busy || syncStatus === 'syncing'} onClick={() => run(syncNow)}>
              {t('settings.syncNow')}
            </button>
            <button
              className="btn"
              onClick={() =>
                run(async () => {
                  await sync.signOut();
                  setHousehold(null);
                  await refreshSync();
                })
              }
            >
              {t('settings.signOut')}
            </button>
          </div>
        </>
      )}

      {syncError && <p className="error">{t('settings.syncProblem', { error: syncError })}</p>}
      {msg && <p className="notice">{msg}</p>}

      {cfg && !sync.configFromEnv() && (
        <button
          className="link-btn"
          onClick={() => {
            if (!confirm(t('settings.disconnectConfirm'))) return;
            void sync.signOut().finally(() => {
              sync.saveSyncConfig(null);
              window.location.reload();
            });
          }}
        >
          {t('settings.disconnect')}
        </button>
      )}
    </section>
  );
}

type AuthMode = 'signin' | 'signup' | 'reset';

/** Email + password. Works inside home-screen apps; email links are only needed once (confirm / reset) and can open in any browser. */
function AuthForm() {
  const { t } = useI18n();
  const { refreshSync } = useStore();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ kind: 'notice' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const explain = (e: unknown): string => {
    const m = e instanceof Error ? e.message : String(e);
    if (m === 'already-registered' || /already registered/i.test(m)) return t('auth.errExists');
    if (/invalid login credentials/i.test(m)) return t('auth.errInvalid');
    if (/email not confirmed/i.test(m)) return t('auth.errUnconfirmed');
    if (/rate limit|too many|security purposes/i.test(m)) return t('auth.errRate');
    if (/password/i.test(m) && /(short|least|weak)/i.test(m)) return t('auth.errWeak');
    return m;
  };

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const mail = email.trim();
    try {
      if (mode === 'signin') {
        await sync.signInWithPassword(mail, password);
        await refreshSync();
      } else if (mode === 'signup') {
        const signedIn = await sync.signUp(mail, password);
        if (signedIn) await refreshSync();
        else {
          setMsg({ kind: 'notice', text: t('auth.confirmSent', { email: mail }) });
          setMode('signin');
        }
      } else {
        await sync.sendPasswordReset(mail);
        setMsg({ kind: 'notice', text: t('auth.resetSent', { email: mail }) });
        setMode('signin');
      }
    } catch (e) {
      setMsg({ kind: 'error', text: explain(e) });
    } finally {
      setBusy(false);
    }
  };

  const MODES = [
    { value: 'signin', label: t('auth.signIn') },
    { value: 'signup', label: t('auth.createAccount') },
  ] as const;

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {mode !== 'reset' && <Chips label={t('auth.signIn')} options={MODES} value={mode} onChange={(m) => (setMode(m), setMsg(null))} />}
      {mode === 'signup' && <p className="muted small">{t('auth.signupIntro')}</p>}
      {mode === 'reset' && <p className="muted small">{t('auth.resetIntro')}</p>}
      <Field label={t('settings.email')}>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {mode !== 'reset' && (
        <Field label={t('auth.password')} hint={mode === 'signup' ? t('auth.passwordHint') : undefined}>
          <input
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={mode === 'signup' ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      )}
      <button className="btn btn-primary" disabled={busy}>
        {mode === 'signin' ? t('auth.signIn') : mode === 'signup' ? t('auth.createAccount') : t('auth.sendReset')}
      </button>
      {mode === 'signin' && (
        <button type="button" className="link-btn" onClick={() => (setMode('reset'), setMsg(null))}>
          {t('auth.forgot')}
        </button>
      )}
      {mode === 'reset' && (
        <button type="button" className="link-btn" onClick={() => (setMode('signin'), setMsg(null))}>
          {t('auth.backToSignIn')}
        </button>
      )}
      {msg && <p className={msg.kind}>{msg.text}</p>}
    </form>
  );
}

function NewPasswordForm() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  if (done) return <p className="notice">{t('auth.passwordUpdated')}</p>;
  return (
    <form
      className="form card-inset"
      onSubmit={(e) => {
        e.preventDefault();
        sync
          .updatePassword(password)
          .then(() => setDone(true))
          .catch((err) => setMsg(err instanceof Error ? err.message : String(err)));
      }}
    >
      <h3>{t('auth.newPasswordTitle')}</h3>
      <Field label={t('auth.newPassword')} hint={t('auth.passwordHint')}>
        <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <button className="btn btn-primary">{t('auth.savePassword')}</button>
      {msg && <p className="error">{msg}</p>}
    </form>
  );
}

function BackupCard() {
  const { t, lang } = useI18n();
  const { data, replaceAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: 'cobberdog-essentials', version: 2, exportedAt: new Date().toISOString(), data }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `puppy-backup-${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const incoming: Partial<Collections> = parsed.data ?? parsed;
      const next = { ...data };
      let count = 0;
      for (const name of COLLECTION_NAMES) {
        const list = incoming[name] as unknown;
        if (!Array.isArray(list)) continue;
        const valid = (list as Base[]).filter((r): r is Base => r && typeof r.id === 'string' && typeof r.updatedAt === 'string');
        count += valid.length;
        (next[name] as Base[]) = mergeRecords(next[name] as Base[], valid);
      }
      replaceAll(next as Collections);
      setMsg(t('settings.imported', { n: count }));
    } catch {
      setMsg(t('settings.importFailed'));
    }
  };

  return (
    <section className="card form">
      <h2>{t('settings.backup')}</h2>
      <p className="muted small">{t('settings.backupIntro')}</p>
      <div className="row-gap">
        <button className="btn btn-primary" onClick={exportJson}>
          {t('settings.export')}
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          {t('settings.import')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importJson(f);
            e.target.value = '';
          }}
        />
      </div>
      {msg && <p className="notice">{msg}</p>}
      <button
        className="link-btn danger"
        onClick={() => {
          if (!confirm(t('settings.restoreConfirm'))) return;
          // Re-stamp seed records so they win over local edits/deletions.
          const p = getProfile(data);
          const seed = buildSeed({ lang, country: p?.country, breed: p?.breed });
          const stamp = new Date().toISOString();
          const next = { ...data };
          for (const name of COLLECTION_NAMES) {
            const restamped = (seed[name] as Base[]).map((r) => ({ ...r, updatedAt: stamp }));
            (next[name] as Base[]) = mergeRecords(next[name] as Base[], restamped);
          }
          replaceAll(next);
          setMsg(t('settings.restored'));
        }}
      >
        {t('settings.restore')}
      </button>
    </section>
  );
}
