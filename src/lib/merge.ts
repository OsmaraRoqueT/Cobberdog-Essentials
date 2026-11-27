import type { Base } from '../types';

/** Merge two versions of a collection: for each id the newest updatedAt wins (ties keep local). */
export function mergeRecords<T extends Base>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const r of local) byId.set(r.id, r);
  for (const r of remote) {
    const mine = byId.get(r.id);
    if (!mine || r.updatedAt > mine.updatedAt) byId.set(r.id, r);
  }
  return [...byId.values()];
}

/** Records that exist locally but are missing or older on the remote side — these need pushing. */
export function newerThanRemote<T extends Base>(local: T[], remote: T[]): T[] {
  const remoteById = new Map(remote.map((r) => [r.id, r]));
  return local.filter((r) => {
    const theirs = remoteById.get(r.id);
    return !theirs || r.updatedAt > theirs.updatedAt;
  });
}

export const now = () => new Date().toISOString();

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
