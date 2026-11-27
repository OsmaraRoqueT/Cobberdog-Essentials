import { createClient, type SupabaseClient, type Session as AuthSession } from '@supabase/supabase-js';
import type { Base, CollectionName } from '../types';

export interface SyncConfig {
  url: string;
  anonKey: string;
}
export interface Household {
  id: string;
  name: string;
  join_code: string;
}
export interface RemoteRecord {
  collection: CollectionName;
  record: Base;
}

const CONFIG_KEY = 'cobberdog:sync-config';
const HOUSEHOLD_KEY = 'cobberdog:household';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — sync settings just won't persist */
  }
}

/** Build-time env vars win; otherwise use what was typed into Settings. */
export function getSyncConfig(): SyncConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (url && anonKey) return { url, anonKey };
  const raw = safeGet(CONFIG_KEY);
  return raw ? (JSON.parse(raw) as SyncConfig) : null;
}
export const configFromEnv = () => Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export function saveSyncConfig(cfg: SyncConfig | null) {
  safeSet(CONFIG_KEY, cfg ? JSON.stringify(cfg) : null);
  client = null;
}

export function getSavedHousehold(): Household | null {
  const raw = safeGet(HOUSEHOLD_KEY);
  return raw ? (JSON.parse(raw) as Household) : null;
}
export function saveHousehold(h: Household | null) {
  safeSet(HOUSEHOLD_KEY, h ? JSON.stringify(h) : null);
}

let client: SupabaseClient | null = null;
export function getClient(): SupabaseClient | null {
  const cfg = getSyncConfig();
  if (!cfg) return null;
  if (!client) client = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
  return client;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const c = getClient();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session;
}

/** Where confirmation and password-reset links should land: the app itself, without any #tab. */
const appUrl = () => window.location.href.split('#')[0].split('?')[0];

/**
 * Captured at load, before supabase-js consumes the URL: the user arrived from a password-reset email.
 * The reset link opens in the browser (also on iPhone/iPad), signs in there, and we ask for a new password.
 */
const arrivedForRecovery = typeof window !== 'undefined' && /type=recovery/.test(window.location.hash + window.location.search);
let recoveryPending = arrivedForRecovery;
export const isRecovery = () => recoveryPending;
export const clearRecovery = () => {
  recoveryPending = false;
};

/** Create an account. Returns true if signed in straight away, false if the email must be confirmed first. */
export async function signUp(email: string, password: string): Promise<boolean> {
  const c = getClient();
  if (!c) throw new Error('Sync is not configured');
  const { data, error } = await c.auth.signUp({ email, password, options: { emailRedirectTo: appUrl() } });
  if (error) throw error;
  // Supabase hides whether an address is already registered: an existing, confirmed user comes back with no identities.
  if (data.user && data.user.identities?.length === 0) throw new Error('already-registered');
  return Boolean(data.session);
}

export async function signInWithPassword(email: string, password: string) {
  const c = getClient();
  if (!c) throw new Error('Sync is not configured');
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const c = getClient();
  if (!c) throw new Error('Sync is not configured');
  const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: appUrl() });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const c = getClient();
  if (!c) throw new Error('Sync is not configured');
  const { error } = await c.auth.updateUser({ password });
  if (error) throw error;
  clearRecovery();
}

export async function signOut() {
  await getClient()?.auth.signOut();
  saveHousehold(null);
}

export async function createHousehold(name: string): Promise<Household> {
  const { data, error } = await getClient()!.rpc('create_household', { household_name: name });
  if (error) throw error;
  return data as Household;
}

export async function joinHousehold(code: string): Promise<Household> {
  const { data, error } = await getClient()!.rpc('join_household', { code });
  if (error) throw error;
  return data as Household;
}

/** Household memberships of the signed-in user (used to restore the household after sign-in). */
export async function myHouseholds(): Promise<Household[]> {
  const { data, error } = await getClient()!.from('households').select('id,name,join_code');
  if (error) throw error;
  return (data ?? []) as Household[];
}

interface Row {
  collection: CollectionName;
  id: string;
  data: Base;
  updated_at: string;
  deleted: boolean;
}

const fromRow = (r: Row): RemoteRecord => ({
  collection: r.collection,
  record: { ...r.data, id: r.id, updatedAt: new Date(r.updated_at).toISOString(), deleted: r.deleted },
});

export async function pullAll(householdId: string): Promise<RemoteRecord[]> {
  const out: RemoteRecord[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await getClient()!
      .from('records')
      .select('collection,id,data,updated_at,deleted')
      .eq('household_id', householdId)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    out.push(...(data as Row[]).map(fromRow));
    if (!data || data.length < pageSize) break;
  }
  return out;
}

export async function pushRecords(householdId: string, items: RemoteRecord[]) {
  if (!items.length) return;
  const rows = items.map(({ collection, record }) => ({
    household_id: householdId,
    collection,
    id: record.id,
    data: record,
    updated_at: record.updatedAt,
    deleted: Boolean(record.deleted),
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await getClient()!.from('records').upsert(rows.slice(i, i + 500));
    if (error) throw error;
  }
}

export function subscribe(householdId: string, onRecord: (r: RemoteRecord) => void): () => void {
  const c = getClient()!;
  const channel = c
    .channel(`records-${householdId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'records', filter: `household_id=eq.${householdId}` },
      (payload) => {
        if (payload.new && 'id' in payload.new) onRecord(fromRow(payload.new as Row));
      },
    )
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}
