/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_SHA__: string;
declare const __APP_BUILD_DATE__: string;

interface ImportMetaEnv {
  /** PostHog project API key. UNSET = analytics fully disabled (no-op). */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog host. Optional — defaults to https://us.i.posthog.com. */
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
