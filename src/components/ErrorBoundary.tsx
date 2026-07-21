import React from 'react';

interface Props { children: React.ReactNode }
interface State { hasError: boolean }

/**
 * Top-level crash guard. Anything that throws during render – corrupt
 * localStorage, a bad deck field, a component bug – shows a recoverable
 * fallback instead of a blank white screen. Styles are inline so the
 * fallback renders even if the stylesheet failed to load.
 *
 * Note: does NOT catch errors in event handlers or async code (React
 * boundaries never do); those are already swallowed defensively elsewhere
 * (audio, storage, analytics all fail silently).
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    // Best-effort log; never rethrow.
    try { console.error('App crashed:', error, info); } catch { /* noop */ }
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
        padding: '2rem', textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1f2937', background: '#faf5ff',
      }}>
        <div style={{ fontSize: '2rem' }}>😵‍💫</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', maxWidth: '20rem', margin: 0 }}>
          The app hit an unexpected error. Your progress is saved on this device – a reload usually fixes it.
        </p>
        <button
          onClick={() => { try { window.location.reload(); } catch { /* noop */ } }}
          style={{
            padding: '0.6rem 1.4rem', borderRadius: '0.6rem', border: 'none',
            background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
