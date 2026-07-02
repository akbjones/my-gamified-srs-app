import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Detects when a new service worker has activated and prompts the user
 * to reload. Necessary because our audio pipeline occasionally
 * reshuffles which MP3 file corresponds to which card. When that
 * happens, users on a stale bundle end up hearing audio from the WRONG
 * card — the visible sentence and the audio no longer match. Once a
 * new SW takes control we cannot un-poison in-memory state; only a
 * page reload fixes it.
 *
 * We rely on the vite-pwa "autoUpdate" registration: it silently
 * downloads and swaps the SW as soon as a new one is available. This
 * component watches the `controllerchange` event to know when to show
 * the banner.
 */
const UpdatePrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Fires exactly once — when a new SW takes over from an old one.
    // The initial page load doesn't fire this because no controller was
    // previously in place. That means we only bother the user on genuine
    // updates, not first-run.
    let notified = false;
    const onControllerChange = () => {
      if (notified) return;
      notified = true;
      setVisible(true);
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 p-3 pointer-events-none"
      role="status"
    >
      <div className="max-w-md mx-auto pointer-events-auto flex items-center gap-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--accent)]/40 shadow-2xl px-4 py-3 animate-slide-up">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
          <RefreshCw size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-[var(--text-primary)]">
            New version ready
          </div>
          <div className="text-xs text-[var(--text-secondary)] leading-snug">
            Reload to apply — cards and audio will resync.
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider active:scale-95"
        >
          Reload
        </button>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default UpdatePrompt;
