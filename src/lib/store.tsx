import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { applySeed, buildSeed, isPristineSeed } from '../content';
import { useI18n, type Lang } from '../i18n';
import { COLLECTION_NAMES, type Base, type CollectionName, type Collections } from '../types';
import { mergeRecords, newerThanRemote, now } from './merge';
import * as sync from './sync';

const DATA_KEY = 'cobberdog:data';

export type SyncStatus = 'local-only' | 'signed-out' | 'no-household' | 'syncing' | 'synced' | 'offline' | 'error';

export const PROFILE_ID = 'puppy';
export const getProfile = (data: Collections) => data.profile.find((p) => p.id === PROFILE_ID && !p.deleted);

/** Current seed (for this language + the household's country/breed) laid under the user's data. */
export function withSeed(data: Collections, lang: Lang): Collections {
  const p = getProfile(data);
  return applySeed(data, buildSeed({ lang, country: p?.country, breed: p?.breed }));
}

function loadData(lang: Lang): Collections {
  let stored: Partial<Collections> = {};
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {
    /* corrupted or unavailable storage — start from seed */
  }
  const base = {} as Collections;
  for (const name of COLLECTION_NAMES) (base[name] as Base[]) = (stored[name] as Base[]) ?? [];
  return withSeed(base, lang);
}

function persist(data: Collections) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {
    /* quota or private mode — data lives in memory for this session */
  }
}

interface StoreApi {
  data: Collections;
  upsert<K extends CollectionName>(collection: K, record: Collections[K][number]): void;
  remove(collection: CollectionName, id: string): void;
  replaceAll(data: Collections): void;
  syncStatus: SyncStatus;
  syncError: string | null;
  household: sync.Household | null;
  userEmail: string | null;
  syncNow(): Promise<void>;
  refreshSync(): Promise<void>;
  setHousehold(h: sync.Household | null): void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const langRef = useRef(lang);
  langRef.current = lang;
  const [data, setData] = useState<Collections>(() => loadData(lang));
  const dataRef = useRef(data);
  dataRef.current = data;

  const [household, setHouseholdState] = useState<sync.Household | null>(sync.getSavedHousehold);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local-only');
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncTimer = useRef<number | undefined>(undefined);
  const syncing = useRef(false);

  const commit = useCallback((raw: Collections) => {
    const next = withSeed(raw, langRef.current);
    dataRef.current = next;
    setData(next);
    persist(next);
  }, []);

  const profile = getProfile(data);
  useEffect(() => {
    commit(dataRef.current);
  }, [lang, profile?.country, profile?.breed, commit]);

  const syncNow = useCallback(async () => {
    const h = household;
    if (!h || !sync.getClient() || syncing.current) return;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    syncing.current = true;
    setSyncStatus('syncing');
    try {
      const remote = await sync.pullAll(h.id);
      const current = dataRef.current;
      const merged = {} as Collections;
      const toPush: sync.RemoteRecord[] = [];
      for (const name of COLLECTION_NAMES) {
        const theirs = remote.filter((r) => r.collection === name).map((r) => r.record);
        (merged[name] as Base[]) = mergeRecords(current[name] as Base[], theirs);
        // Untouched starter content is generated on each device in its own language; never upload it.
        const local = (current[name] as Base[]).filter((r) => !isPristineSeed(r));
        for (const record of newerThanRemote(local, theirs)) toPush.push({ collection: name, record });
      }
      await sync.pushRecords(h.id, toPush);
      // Keep edits made while we were awaiting the network.
      const latest = dataRef.current;
      for (const name of COLLECTION_NAMES) {
        (merged[name] as Base[]) = mergeRecords(merged[name] as Base[], latest[name] as Base[]);
      }
      commit(merged);
      setSyncStatus('synced');
      setSyncError(null);
    } catch (e) {
      setSyncStatus('error');
      setSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      syncing.current = false;
    }
  }, [household, commit]);

  const scheduleSync = useCallback(() => {
    window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => void syncNow(), 1200);
  }, [syncNow]);

  const refreshSync = useCallback(async () => {
    const client = sync.getClient();
    if (!client) {
      setSyncStatus('local-only');
      setUserEmail(null);
      return;
    }
    const session = await sync.getAuthSession();
    setUserEmail(session?.user.email ?? null);
    if (!session) return setSyncStatus('signed-out');
    if (!household) {
      // Signed in on a new device: restore the household automatically if there's exactly one.
      try {
        const mine = await sync.myHouseholds();
        if (mine.length === 1) {
          sync.saveHousehold(mine[0]);
          setHouseholdState(mine[0]);
          return;
        }
      } catch {
        /* fall through to manual join */
      }
      return setSyncStatus('no-household');
    }
    await syncNow();
  }, [household, syncNow]);

  // Initial auth check + react to sign-in via magic link.
  useEffect(() => {
    void refreshSync();
    const client = sync.getClient();
    if (!client) return;
    const { data: sub } = client.auth.onAuthStateChange(() => void refreshSync());
    return () => sub.subscription.unsubscribe();
  }, [refreshSync]);

  // Live updates from other household members + resync when coming back online/foreground.
  useEffect(() => {
    if (!household || !sync.getClient()) return;
    const unsubscribe = sync.subscribe(household.id, ({ collection, record }) => {
      const current = dataRef.current;
      if (!COLLECTION_NAMES.includes(collection)) return;
      const next = { ...current, [collection]: mergeRecords(current[collection] as Base[], [record]) } as Collections;
      commit(next);
    });
    const onOnline = () => void syncNow();
    const onVisible = () => document.visibilityState === 'visible' && void syncNow();
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      unsubscribe();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [household, syncNow, commit]);

  const upsert = useCallback(
    <K extends CollectionName>(collection: K, record: Collections[K][number]) => {
      const current = dataRef.current;
      const stamped = { ...record, updatedAt: now() };
      const list = current[collection] as Base[];
      const exists = list.some((r) => r.id === record.id);
      const nextList = exists ? list.map((r) => (r.id === record.id ? stamped : r)) : [...list, stamped];
      commit({ ...current, [collection]: nextList } as Collections);
      scheduleSync();
    },
    [commit, scheduleSync],
  );

  const remove = useCallback(
    (collection: CollectionName, id: string) => {
      const current = dataRef.current;
      const list = (current[collection] as Base[]).map((r) => (r.id === id ? { ...r, deleted: true, updatedAt: now() } : r));
      commit({ ...current, [collection]: list } as Collections);
      scheduleSync();
    },
    [commit, scheduleSync],
  );

  const replaceAll = useCallback(
    (next: Collections) => {
      commit(next);
      scheduleSync();
    },
    [commit, scheduleSync],
  );

  const setHousehold = useCallback((h: sync.Household | null) => {
    sync.saveHousehold(h);
    setHouseholdState(h);
  }, []);

  const api = useMemo<StoreApi>(
    () => ({ data, upsert, remove, replaceAll, syncStatus, syncError, household, userEmail, syncNow, refreshSync, setHousehold }),
    [data, upsert, remove, replaceAll, syncStatus, syncError, household, userEmail, syncNow, refreshSync, setHousehold],
  );
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Live (non-deleted) records of a collection. */
export function useCollection<K extends CollectionName>(name: K): Collections[K] {
  const { data } = useStore();
  return useMemo(() => (data[name] as Base[]).filter((r) => !r.deleted) as Collections[K], [data, name]);
}
