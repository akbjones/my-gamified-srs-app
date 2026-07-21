import React, { useEffect, useState } from 'react';
import { RefreshCw, Copy, Check, Cloud, Link2, AlertTriangle } from 'lucide-react';
import * as sync from '../services/syncService';

const msg = (e: unknown) => (e as Error)?.message || 'Something went wrong. Try again when you\'re online.';

/** "Sync across devices" section for the Settings panel. Self-contained: owns
 *  its own state and talks to syncService directly. Renders nothing unless the
 *  Supabase env is configured, so it's invisible until sync is set up. */
export const SyncSettings: React.FC = () => {
  const [code, setCode] = useState<string | null>(sync.getCode());
  const [status, setStatus] = useState(sync.getStatus());
  const [justEnabled, setJustEnabled] = useState(false); // show the save-the-code gate
  const [showPair, setShowPair] = useState(false);
  const [pairInput, setPairInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => sync.onStatus(setStatus), []);

  if (!sync.isSyncConfigured()) return null;

  const enable = async () => {
    setBusy(true); setErr(null);
    try { const c = await sync.enableSync(); setCode(c); setJustEnabled(true); }
    catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  };
  const pair = async () => {
    setBusy(true); setErr(null);
    const res = await sync.pairWithCode(pairInput);
    setBusy(false);
    if (res.ok) window.location.reload(); // rehydrate with the merged progress
    else setErr(res.error || 'Failed to pair.');
  };
  const syncNow = async () => {
    setBusy(true); setErr(null);
    try { const changed = await sync.syncNow(); if (changed.length) window.location.reload(); }
    catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  };
  const unpair = () => {
    if (confirm('Stop syncing on this device? Your progress here stays put; your other device and the cloud copy are untouched.')) {
      sync.unpair(); setCode(null); setJustEnabled(false); setRevealed(false);
    }
  };
  const copy = () => { try { navigator.clipboard?.writeText(code || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };

  const label = 'text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide';
  const btn = 'px-3 py-2.5 text-sm font-bold rounded-lg active:scale-95 transition-all';
  const btnOutline = `${btn} text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/10`;

  const statusPill = () => {
    const map: Record<sync.SyncStatus, { t: string; c: string }> = {
      idle: { t: 'Ready', c: 'text-[var(--text-faint)]' },
      syncing: { t: 'Syncing…', c: 'text-[var(--accent)]' },
      synced: { t: 'Synced ✓', c: 'text-emerald-500' },
      offline: { t: 'Offline — will sync later', c: 'text-amber-500' },
      error: { t: 'Sync error — retries automatically', c: 'text-red-500' },
    };
    const s = map[status];
    return <span className={`text-[11px] font-bold ${s.c}`}>{s.t}</span>;
  };

  return (
    <div id="sync-settings" className="pt-4 border-t border-[var(--border-color)] space-y-2">
      <div className="flex items-center gap-2">
        <Cloud size={14} className="text-[var(--accent)]" />
        <span className={label}>Sync across devices</span>
      </div>

      {/* ── OFF ── */}
      {!code && (
        <>
          <p className="text-[11px] text-[var(--text-muted)] leading-snug">
            Study on your phone and computer with one shared progress. No account or email — you get a private sync code to link your devices.
          </p>
          {err && <p className="text-[11px] text-red-500">{err}</p>}
          <div className="flex gap-2">
            <button onClick={enable} disabled={busy} className={`flex-1 ${btnOutline} disabled:opacity-50`}>
              {busy ? 'Setting up…' : 'Turn on sync'}
            </button>
            <button onClick={() => { setShowPair(v => !v); setErr(null); }} className={`flex-1 ${btn} text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)]/40`}>
              <span className="inline-flex items-center gap-1.5"><Link2 size={13} /> Use a code</span>
            </button>
          </div>
          {showPair && (
            <div className="flex gap-2 pt-1">
              <input
                value={pairInput}
                onChange={e => setPairInput(e.target.value)}
                placeholder="Paste code from your other device"
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg-inset)] border border-[var(--border-color)] font-mono tracking-wide"
              />
              <button onClick={pair} disabled={busy || pairInput.trim().length < 4} className={`${btnOutline} disabled:opacity-40`}>
                {busy ? '…' : 'Pair'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── JUST ENABLED: save-the-code gate ── */}
      {code && justEnabled && (
        <div className="space-y-2">
          <p className="text-[11px] text-[var(--text-secondary)] leading-snug font-semibold">Sync is on. Here's your code:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 rounded-lg bg-[var(--bg-inset)] border border-[var(--accent)]/30 font-mono text-sm tracking-wider text-[var(--text-primary)] break-all">{code}</code>
            <button onClick={copy} className={`${btnOutline} shrink-0`} aria-label="Copy code">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>Save this code somewhere safe (there's no email recovery). Enter it on your other device to link them. Anyone with the code can read your progress.</span>
          </div>
          <button onClick={() => setJustEnabled(false)} className={`w-full ${btnOutline}`}>I've saved it</button>
        </div>
      )}

      {/* ── ON ── */}
      {code && !justEnabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {statusPill()}
            {sync.getLastSyncedAt() > 0 && <span className="text-[10px] text-[var(--text-faint)]">last: {new Date(sync.getLastSyncedAt()).toLocaleString()}</span>}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-color)] font-mono text-sm tracking-wider text-[var(--text-secondary)] break-all">
              {revealed ? code : '••••-••••-••••-••••-••••'}
            </code>
            <button onClick={() => setRevealed(v => !v)} className={`${btn} text-[var(--text-secondary)] border border-[var(--border-color)] text-[11px] shrink-0`}>{revealed ? 'Hide' : 'Show'}</button>
            <button onClick={copy} className={`${btnOutline} shrink-0`} aria-label="Copy code">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
          </div>
          {err && <p className="text-[11px] text-red-500">{err}</p>}
          <div className="flex gap-2">
            <button onClick={syncNow} disabled={busy} className={`flex-1 ${btnOutline} disabled:opacity-50`}>
              <span className="inline-flex items-center gap-1.5"><RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> Sync now</span>
            </button>
            <button onClick={unpair} className={`flex-1 ${btn} text-[var(--text-muted)] border border-[var(--border-color)] hover:border-red-500/40 hover:text-red-500`}>Unpair this device</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncSettings;
