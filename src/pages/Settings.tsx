import { useRef, useState } from 'react';
import { Field } from '../components/ui';
import { mergeRecords } from '../lib/merge';
import { seedCollections } from '../data/seed';
import { useStore } from '../lib/store';
import * as sync from '../lib/sync';
import { COLLECTION_NAMES, type Base, type Collections } from '../types';

export default function Settings() {
  return (
    <div className="stack">
      <h1>Settings</h1>
      <SyncCard />
      <BackupCard />
      <p className="muted small">
        Health and care tips in this app are general guidance. Always confirm vaccination, worming and medical decisions with your vet.
      </p>
    </div>
  );
}

function SyncCard() {
  const { syncStatus, syncError, household, userEmail, syncNow, refreshSync, setHousehold } = useStore();
  const cfg = sync.getSyncConfig();
  const [url, setUrl] = useState(cfg?.url ?? '');
  const [key, setKey] = useState(cfg?.anonKey ?? '');
  const [email, setEmail] = useState('');
  const [hhName, setHhName] = useState('Our Cobberdog family');
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
      <h2>Household sync</h2>
      <p className="muted small">
        Everything is saved on this device first, so the app works offline. Turn on sync to share one puppy record with your household. Edits merge and the most
        recent change wins.
      </p>

      {!cfg && (
        <>
          <p className="small">
            Step 1: create a free Supabase project and run <code>supabase/schema.sql</code> (see README). Then paste the project URL and anon key here. Each
            household member enters these once.
          </p>
          <Field label="Supabase project URL">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xyz.supabase.co" />
          </Field>
          <Field label="Supabase anon (public) key">
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
            Connect
          </button>
        </>
      )}

      {cfg && syncStatus === 'signed-out' && (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await sync.sendMagicLink(email.trim());
              setMsg(`Check ${email.trim()} for a sign-in link. Open it on this device.`);
            });
          }}
        >
          <Field label="Your email" hint="We'll email you a one-time sign-in link. No password needed.">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button className="btn btn-primary" disabled={busy}>
            Send sign-in link
          </button>
        </form>
      )}

      {cfg && syncStatus === 'no-household' && (
        <>
          <p className="small">Signed in as {userEmail}. Create a household, or join one with a code from a household member.</p>
          <div className="grid-2">
            <Field label="New household name">
              <input value={hhName} onChange={(e) => setHhName(e.target.value)} />
            </Field>
            <button className="btn btn-primary align-end" disabled={busy || !hhName} onClick={() => run(async () => setHousehold(await sync.createHousehold(hhName)))}>
              Create
            </button>
          </div>
          <div className="grid-2">
            <Field label="Join code">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. 3FA9C21B" />
            </Field>
            <button className="btn align-end" disabled={busy || !code} onClick={() => run(async () => setHousehold(await sync.joinHousehold(code)))}>
              Join
            </button>
          </div>
        </>
      )}

      {cfg && household && userEmail && (
        <>
          <dl className="facts">
            <dt>Household</dt>
            <dd>{household.name}</dd>
            <dt>Join code</dt>
            <dd>
              <code className="big-code">{household.join_code}</code>
            </dd>
            <dt>Signed in</dt>
            <dd>{userEmail}</dd>
            <dt>Status</dt>
            <dd>{syncStatus}</dd>
          </dl>
          <p className="muted small">Share the join code only with people you want to see and edit your puppy's records.</p>
          <div className="row-gap">
            <button className="btn btn-primary" disabled={busy || syncStatus === 'syncing'} onClick={() => run(syncNow)}>
              Sync now
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
              Sign out
            </button>
          </div>
        </>
      )}

      {syncError && <p className="error">Sync problem: {syncError}</p>}
      {msg && <p className="notice">{msg}</p>}

      {cfg && !sync.configFromEnv() && (
        <button
          className="link-btn"
          onClick={() => {
            if (!confirm('Disconnect sync on this device? Your local data stays.')) return;
            void sync.signOut().finally(() => {
              sync.saveSyncConfig(null);
              window.location.reload();
            });
          }}
        >
          Disconnect Supabase on this device
        </button>
      )}
    </section>
  );
}

function BackupCard() {
  const { data, replaceAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: 'cobberdog-essentials', version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cobberdog-backup-${new Date().toLocaleDateString('en-CA')}.json`;
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
      setMsg(`Imported ${count} records (newer versions kept).`);
    } catch {
      setMsg('That file could not be read as a Cobberdog backup.');
    }
  };

  return (
    <section className="card form">
      <h2>Backup</h2>
      <p className="muted small">Download a copy of everything. Recommended even with sync turned on.</p>
      <div className="row-gap">
        <button className="btn btn-primary" onClick={exportJson}>
          Export backup
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import backup
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
          if (!confirm('Restore all starter content you deleted or edited? Your own added items are kept.')) return;
          // Re-stamp seed records so they win over local edits/deletions.
          const seed = seedCollections();
          const stamp = new Date().toISOString();
          const next = { ...data };
          for (const name of COLLECTION_NAMES) {
            const restamped = (seed[name] as Base[]).map((r) => ({ ...r, updatedAt: stamp }));
            (next[name] as Base[]) = mergeRecords(next[name] as Base[], restamped);
          }
          replaceAll(next);
          setMsg('Starter content restored.');
        }}
      >
        Restore starter content
      </button>
    </section>
  );
}
