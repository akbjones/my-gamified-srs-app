// Cross-device sync transport — accountless "sync code" over Supabase RPCs.
//
// localStorage stays the working source of truth; this is a background mirror.
// Nothing here runs unless VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set
// (feature no-ops otherwise) AND the user has turned sync on (a code exists).
// The Supabase SDK is dynamically imported so anonymous visitors never download
// it. All merge correctness lives in syncMerge.ts; this file just moves bytes
// and orchestrates the mastery→stats dependency.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  keyKind, mergeMastery, reconcileStats, mergeSettings, mergeIndependent, stripSecret,
} from './syncMerge';
import type { MasteryMap } from '../types';
import type { StudySettings } from './storageService';

// ── config ───────────────────────────────────────────────────────────────────
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const isSyncConfigured = (): boolean => !!URL && !!ANON;

// Internal localStorage keys (NOT synced — filtered out of the synced keyspace).
const K_CODE = 'quest_sync_code';
const K_DIRTY = 'quest_sync_dirty';
const K_VERSIONS = 'quest_sync_versions'; // { [storageKey]: version } for OCC
const K_LAST = 'quest_sync_lastAt';
const K_RESET = 'quest_sync_reset_seen'; // highest reset epoch we've applied

// ── guarded localStorage (storage APIs can throw) ─────────────────────────────
const ls: Storage | null = (() => { try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; } })();
const get = (k: string): string | null => { try { return ls ? ls.getItem(k) : null; } catch { return null; } };
const set = (k: string, v: string): void => { try { ls?.setItem(k, v); } catch { /* quota/disabled */ } };
const del = (k: string): void => { try { ls?.removeItem(k); } catch { /* ignore */ } };
const parse = <T>(s: string | null, d: T): T => { if (s == null) return d; try { return JSON.parse(s) as T; } catch { return d; } };

// A storage key is "synced" if it's a progress key (quest_*) that isn't one of
// our own internal sync bookkeeping keys.
function isSyncedKey(k: string): boolean {
  return k.startsWith('quest_') && keyKind(k) !== 'unknown';
}
function allSyncedKeys(): string[] {
  const out: string[] = [];
  try { for (let i = 0; i < (ls?.length || 0); i++) { const k = ls!.key(i); if (k && isSyncedKey(k)) out.push(k); } } catch { /* ignore */ }
  return out;
}

// Read a storage key as the JSON value we push (placement is a bare 'true').
function readValue(k: string): unknown {
  const raw = get(k);
  if (raw == null) return null;
  if (keyKind(k) === 'placement') return true;
  return parse<unknown>(raw, null);
}
// Write a merged value back to localStorage in the key's native encoding.
function writeValue(k: string, v: unknown): void {
  if (v == null) return;
  if (keyKind(k) === 'placement') { set(k, 'true'); return; }
  set(k, JSON.stringify(v));
}

// ── dirty set + version map ───────────────────────────────────────────────────
function dirty(): Set<string> { return new Set(parse<string[]>(get(K_DIRTY), [])); }
function saveDirty(s: Set<string>): void { set(K_DIRTY, JSON.stringify([...s])); }
function versions(): Record<string, number> { return parse<Record<string, number>>(get(K_VERSIONS), {}); }
function saveVersions(v: Record<string, number>): void { set(K_VERSIONS, JSON.stringify(v)); }

/** Called by the app whenever a synced key is written locally. No-op if sync
 *  isn't enabled, so it's free to call unconditionally from save paths. */
export function markDirty(key: string): void {
  if (!enabled()) return;
  if (!isSyncedKey(key)) return;
  const s = dirty(); s.add(key); saveDirty(s);
  scheduleFlush();
}

// ── code ──────────────────────────────────────────────────────────────────────
const enabled = (): boolean => isSyncConfigured() && !!get(K_CODE);
export const getCode = (): string | null => get(K_CODE);

// Crockford base32, grouped 4-4-4-4-4 (~100 bits, no ambiguous chars).
function generateCode(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += alphabet[bytes[i] % 32];
  return s.match(/.{1,4}/g)!.join('-');
}
/** Normalize user-typed codes: uppercase, strip anything not in the alphabet,
 *  re-group. Lets a user paste "abcd efgh…" or with/without dashes. */
export function normalizeCode(input: string): string {
  const clean = input.toUpperCase().replace(/[^0-9A-HJKMNP-TV-Z]/g, '');
  return clean.match(/.{1,4}/g)?.join('-') ?? clean;
}
function isValidCode(code: string): boolean { return code.replace(/-/g, '').length >= 20; }

// ── supabase client (lazy, dynamically imported) ──────────────────────────────
let clientPromise: Promise<SupabaseClient> | null = null;
function client(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL!, ANON!, { auth: { persistSession: false } }));
  }
  return clientPromise;
}

// ── status pub/sub for the UI ─────────────────────────────────────────────────
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
let status: SyncStatus = 'idle';
const listeners = new Set<(s: SyncStatus) => void>();
export function onStatus(fn: (s: SyncStatus) => void): () => void { listeners.add(fn); fn(status); return () => listeners.delete(fn); }
function setStatus(s: SyncStatus): void { status = s; listeners.forEach(fn => fn(s)); }
export const getStatus = (): SyncStatus => status;
export const getLastSyncedAt = (): number => parse<number>(get(K_LAST), 0);

// Fired after each sync with the storage keys whose local value actually
// changed (empty on an idempotent re-pull). The app uses this to rehydrate.
const syncedListeners = new Set<(changed: string[]) => void>();
export function onSynced(fn: (changed: string[]) => void): () => void { syncedListeners.add(fn); return () => syncedListeners.delete(fn); }

// ── pull: merge every cloud row into local; return the keys that changed ──────
async function pullInto(code: string): Promise<string[]> {
  const sb = await client();
  const { data, error } = await sb.rpc('sync_pull', { p_code: code });
  if (error) throw error;
  const rows = (data || []) as Array<{ k: string; v: unknown; version: number; reset_at: number }>;

  // Reset epoch: if another device did a full reset after our last-applied
  // epoch, drop local progress first so union-merge can't resurrect it.
  const cloudReset = rows.length ? Number(rows[0].reset_at || 0) : 0;
  const seenReset = parse<number>(get(K_RESET), 0);
  if (cloudReset > seenReset) {
    for (const k of allSyncedKeys()) del(k);
    set(K_RESET, String(cloudReset));
  }

  const v = versions();
  const changed: string[] = [];
  const mergedMastery: Record<string, MasteryMap> = {}; // lang → merged (for stats)

  // Apply a merged value; record the key as *changed* only if it actually
  // differs from what's on disk. sync_pull returns ALL rows every time, so
  // without this every pull would look like a change and a rehydrate-on-change
  // would loop. Idempotent re-pulls now report nothing changed.
  const apply = (k: string, merged: unknown, version: number): void => {
    const before = get(k);
    const after = keyKind(k) === 'placement' ? 'true' : JSON.stringify(merged);
    v[k] = version;
    if (after !== before) { writeValue(k, merged); changed.push(k); }
  };

  // Pass 1: mastery first (stats depend on it to recompute cardsLearned).
  for (const row of rows) {
    if (keyKind(row.k) !== 'mastery') continue;
    const merged = mergeMastery(readValue(row.k) as MasteryMap, row.v as MasteryMap);
    mergedMastery[langOf(row.k)] = merged;
    apply(row.k, merged, row.version);
  }
  // Pass 2: everything else.
  for (const row of rows) {
    const kind = keyKind(row.k);
    if (kind === 'mastery') continue;
    let merged: unknown;
    if (kind === 'stats') merged = reconcileStats(readValue(row.k) as never, row.v as never, mergedMastery[langOf(row.k)]);
    else if (kind === 'settings') merged = mergeSettings(readValue(row.k) as StudySettings, row.v as Partial<StudySettings>);
    else merged = mergeIndependent(row.k, readValue(row.k), row.v);
    apply(row.k, merged, row.version);
  }
  saveVersions(v);
  return changed;
}
function langOf(k: string): string { const i = k.lastIndexOf('_'); return k.slice(i + 1); }

// ── push: upload dirty keys with optimistic concurrency + bounded retry ───────
async function pushDirty(code: string): Promise<void> {
  const sb = await client();
  let attempts = 0;
  while (dirty().size && attempts < 4) {
    attempts++;
    let conflicted = false;
    const v = versions();
    for (const k of [...dirty()]) {
      let value = readValue(k);
      if (value == null) { const s = dirty(); s.delete(k); saveDirty(s); continue; }
      if (keyKind(k) === 'settings') value = stripSecret(value as StudySettings); // never upload the API key
      const { data, error } = await sb.rpc('sync_push', { p_code: code, p_key: k, p_value: value, p_base_version: v[k] ?? 0 });
      if (error) throw error;
      const res = (data as Array<{ version: number; conflict: boolean }>)?.[0];
      if (res?.conflict) { conflicted = true; break; }
      v[k] = res?.version ?? (v[k] ?? 0) + 1;
      const s = dirty(); s.delete(k); saveDirty(s);
    }
    saveVersions(v);
    if (conflicted) { await pullInto(code); /* re-merge, then loop re-pushes remaining dirty */ }
    else break;
  }
}

// ── public: pull-then-push. Returns changed keys so the app can rehydrate ─────
let inflight: Promise<string[]> | null = null;
export async function syncNow(): Promise<string[]> {
  if (!enabled()) return [];
  if (inflight) return inflight;
  const code = get(K_CODE)!;
  inflight = (async () => {
    setStatus('syncing');
    try {
      const changed = await pullInto(code);
      await pushDirty(code);
      set(K_LAST, String(nowMs()));
      setStatus('synced');
      if (changed.length) syncedListeners.forEach(fn => fn(changed));
      return changed;
    } catch (e) {
      setStatus(navigator.onLine ? 'error' : 'offline');
      throw e;
    } finally { inflight = null; }
  })();
  return inflight;
}
function nowMs(): number { try { return Date.now(); } catch { return 0; } }

// ── enable / pair / unpair ────────────────────────────────────────────────────
/** Turn sync ON for the first time on this device: mint a code, mark all
 *  existing progress dirty, push it up. Returns the code to show the user. */
export async function enableSync(): Promise<string> {
  const code = generateCode();
  set(K_CODE, code);
  const s = new Set(allSyncedKeys()); saveDirty(s); // everything is dirty on first enable
  await syncNow();
  return code;
}
/** Pair this device with an existing code from another device. Pulls+merges
 *  cloud into local (nothing is overwritten — merge is additive), then pushes
 *  this device's own additions back. */
export async function pairWithCode(input: string): Promise<{ ok: boolean; changed?: string[]; error?: string }> {
  const code = normalizeCode(input);
  if (!isValidCode(code)) return { ok: false, error: 'That code looks too short — check you copied all of it.' };
  set(K_CODE, code);
  const s = new Set(allSyncedKeys()); saveDirty(s); // push our local extras up after the merge
  try { const changed = await syncNow(); return { ok: true, changed }; }
  catch (e) { del(K_CODE); return { ok: false, error: (e as Error)?.message || 'Could not reach sync. Try again when online.' }; }
}
/** Stop syncing on THIS device. Local progress is untouched; the cloud row and
 *  the other device are unaffected. */
export function unpair(): void {
  del(K_CODE); del(K_DIRTY); del(K_VERSIONS); del(K_LAST); del(K_RESET);
  setStatus('idle');
}

/** Called by resetAll() — wipe the cloud rows and bump the epoch so the other
 *  device drops its copy on next pull instead of re-syncing the old data. */
export async function onReset(): Promise<void> {
  if (!enabled()) return;
  const code = get(K_CODE)!;
  del(K_DIRTY); saveVersions({});
  const epoch = nowMs();
  set(K_RESET, String(epoch));
  try { const sb = await client(); await sb.rpc('sync_wipe', { p_code: code, p_reset_at: epoch }); } catch { /* retried on next sync */ }
}

// ── debounced flush + lifecycle wiring ────────────────────────────────────────
let flushTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleFlush(): void {
  if (!enabled()) return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { flushTimer = null; syncNow().catch(() => { /* status already set */ }); }, 4000);
}

let wired = false;
/** Wire background sync to the app lifecycle. Safe to call once at startup even
 *  when sync is off — every handler no-ops until a code exists. */
export function initSync(): void {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  const flushNow = () => { if (enabled() && dirty().size) syncNow().catch(() => {}); };
  const pullNow = () => { if (enabled()) syncNow().catch(() => {}); };
  window.addEventListener('online', pullNow);
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pullNow(); else flushNow(); });
  window.addEventListener('beforeunload', flushNow);
  if (enabled()) pullNow(); // pull on app open
}
