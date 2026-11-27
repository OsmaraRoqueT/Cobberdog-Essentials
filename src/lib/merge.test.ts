import { describe, expect, it } from 'vitest';
import { mergeRecords, newerThanRemote } from './merge';

const r = (id: string, updatedAt: string, extra: Record<string, unknown> = {}) => ({ id, updatedAt, ...extra });

describe('mergeRecords', () => {
  it('keeps the newest version of each record', () => {
    const local = [r('a', '2026-01-02', { v: 'local' }), r('b', '2026-01-01', { v: 'local' })];
    const remote = [r('a', '2026-01-01', { v: 'remote' }), r('b', '2026-01-03', { v: 'remote' }), r('c', '2026-01-01')];
    const merged = mergeRecords(local, remote);
    expect(merged.find((x) => x.id === 'a')).toMatchObject({ v: 'local' });
    expect(merged.find((x) => x.id === 'b')).toMatchObject({ v: 'remote' });
    expect(merged).toHaveLength(3);
  });

  it('propagates deletions when the delete is newer', () => {
    const merged = mergeRecords([r('a', '2026-01-01')], [r('a', '2026-01-02', { deleted: true })]);
    expect(merged[0]).toMatchObject({ deleted: true });
  });

  it('keeps local on timestamp ties', () => {
    const merged = mergeRecords([r('a', 't', { v: 1 })], [r('a', 't', { v: 2 })]);
    expect(merged[0]).toMatchObject({ v: 1 });
  });
});

describe('newerThanRemote', () => {
  it('returns records missing or older remotely', () => {
    const out = newerThanRemote([r('a', '2'), r('b', '1'), r('c', '1')], [r('a', '1'), r('b', '2')]);
    expect(out.map((x) => x.id).sort()).toEqual(['a', 'c']);
  });
});
