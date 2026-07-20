# Cross-device progress sync — scoping

**Question:** can a user study LangLab on their laptop and phone interchangeably?
**Today:** no — progress is 100% `localStorage`, per device. A manual file Export/Import exists but there's no live sync.

This doc scopes adding real sync. Three architectures were designed and judged against LangLab's actual constraints (offline-first, privacy-first / zero-PII today, imminent Reddit launch that must stay $0 for anonymous visitors, static Netlify site with no server, solo maintainer).

---

## Recommendation: accountless "sync code" + per-card merge (Supabase)

Not email accounts. The synced payload is **non-identifying flashcard progress**, so the usual reason to demand real accounts (protecting identity data) doesn't apply — while every one of the app's constraints points at the accountless model. It wins 4 of 5 weighted axes (privacy, ops, effort, ux-vs-cost) and needs **no Supabase Auth at all** (no monthly-active-user cost, no email config, less code and ops for one maintainer).

**How it works**
- User turns on sync → app generates a high-entropy **sync code** (~100 bits). That code *is* the credential.
- On the other device, user enters the code to pair. Both devices push/pull to one Supabase row-set keyed by the code (SHA-256 hashed at rest).
- **`localStorage` stays the working source of truth** — the study loop never awaits the network. Sync is a background mirror: pull-merge on app open / reconnect, debounced push (~3–5s) on change + on tab-hide.
- **Per-card merge**, not blind last-write-wins: for `quest_mastery_<lang>`, union the card ids and keep whichever side has the newer `lastReview` (ts-fsrs already stamps `lastReview` on every review — verified in `srsService.ts`). So studying Spanish offline on the subway and then opening the laptop **never erases the subway session**. Counters take `max`, sets (achievements/favorites/vocab) union, low-stakes keys (daily/settings) fall to LWW.

**Backend shape** (client-callable, no server to run):
- Table `sync_rows(code_hash, k, v jsonb, version, updated_at, primary key(code_hash,k))` — **one row per existing storage key** (`quest_mastery_<lang>`, …, `quest_settings`), mapping 1:1 onto today's namespaced keyspace. Per-key rows mean each flush uploads only changed keys and the mastery "blast radius" is one key.
- RLS **deny-all** to the public anon key; all access via two `SECURITY DEFINER` RPCs — `sync_pull(code)` and `sync_push(code,key,value,base_version)` — that hash the code, enforce a per-row size cap, and return `conflict=true` on version mismatch (optimistic concurrency; retry = re-pull → merge → re-push).

---

## The one big tradeoff (decide this first)

**No cloud recovery by design.** Lose the sync code and that row is orphaned — there's no email to recover it. This is the price of zero-PII. Mitigations: a mandatory "save your code" gate on setup, keeping the existing **file Export/Import as the durable backup**, and a *deferred, opt-in* magic-link recovery layer (attach an email to an existing code later, post-launch) for users who want it. Some users will still lock themselves out.

The alternative (email magic-link accounts, "Approach A") has the best recovery/UX but spends the app's zero-PII posture — the wrong trade to make *right before a privacy-first Reddit launch*, the right trade to offer *later, opt-in*.

---

## Phased plan

| Phase | Size | Deliverable |
|---|---|---|
| **P0 Backend + client** | S | Supabase project (US East — nearest the audience; no PII so region isn't compliance-driven). SQL migration (`sync_rows`, `sync_epoch`), RLS deny-all, the two `SECURITY DEFINER` RPCs with size cap + version check. Lazy **dynamically-imported** `createClient` singleton so anonymous visitors never download the SDK. `VITE_SUPABASE_URL/ANON_KEY` in `.env.production.local`; feature no-ops when unset (same pattern as PostHog). |
| **P1 Transport** | M | `syncService.ts`: code generation/normalization, `buildScopedPayloads()` (dirty key → row, **strips `googleTtsApiKey`**), pull/push with the OCC retry loop, dirty-set persisted to `quest_sync_dirty`, debounced flush on `visibilitychange`/`beforeunload`/`online`, pull on open/visible/online. |
| **P2 Merge module (+ tests)** | M | Pure, unit-tested merge fns — the risk-bearing code: `mergeMastery` (union by newer `lastReview`), `reconcileStats` (max counters, recompute `cardsLearned` from merged mastery), `mergeProgress`, `unionVocab`, `unionFavorites`, `mergeSettings`. |
| **P3 App integration** | M | Mark the owning scope dirty inside existing `save*` paths; on pull-merge, write merged keys back to `localStorage` and rehydrate React (reuse the deck-load rehydrate, or the reload the import flow already uses). |
| **P4 Settings UI** | M | "Sync across devices" section (no router — same Settings surface): OFF → explainer + "Turn on sync" (generate → **save-the-code gate** → initial push); ENABLED → masked code + reveal/copy, "Sync now", status pill (Synced ✓ / Syncing… / Offline), "Unpair" (keeps local data); PAIR → "Enter a code". Relabel Export/Import as "Backup to file". Hidden for anonymous visitors. |
| **P5 Guardrails + launch gates** | S | `resetAll` bumps `sync_epoch.reset_at` so a reset propagates (**mandatory** — union merges can't express deletion otherwise). Rate limit + size cap. Cross-code penetration test (one code can't read another's rows; anon key can't touch the table directly) — **hard gate**. Verify `googleTtsApiKey` stripped. Free-tier keepalive. Bundle check that the SDK is dynamically imported. |
| **P-LATER Recovery** | M | *Post-launch, optional:* attach an email (Supabase Auth OTP) to an existing code so a lost code is recoverable. Strictly opt-in, EU, with delete-account. Out of launch scope to keep it zero-PII. |

Rough total for a shippable v1: **2 small + 4 medium phases** — on the order of a few focused days, with the merge module (P2) being where the care goes.

---

## Hard launch gates (easy to miss, must not skip)

1. **Strip `googleTtsApiKey` from `quest_settings` before upload.** It lives inside the settings blob (`storageService.ts:143`); a one-line omission would ship a user's real API credential to Postgres.
2. **RLS deny-all + hashed-code RPCs + rate limit + size cap** are the *entire* security boundary. Cross-code + direct-table read tests are launch gates.
3. **`reset_at` epoch** — union merges silently re-add deleted data; a reset would otherwise get undone on next sync.
4. **Dynamic-import `@supabase/supabase-js`** (~40–60 KB gz) so anonymous Reddit visitors don't pay for a feature they never use.

---

## Decisions needed before building

1. **Accountless (zero-PII, no cloud recovery) vs email magic-link (recovery, but PII) for launch?** → *Recommend accountless; magic-link deferred + opt-in.*
2. **Deletion semantics:** `reset_at` epoch only (covers full reset) vs per-item tombstones (also covers un-favorite/un-suspend)? → *Recommend `reset_at` for launch; tombstones only if needed.*
3. **Supabase region** → *US East (N. Virginia).* Revised from EU: the accountless design stores no PII, so GDPR/EU-residency doesn't apply, and sync is a background mirror so latency is near-irrelevant — pick the region nearest the (US-leaning) audience. PostHog being EU is fine; separate anonymous system.
4. **Free-tier auto-pause** (~7 days idle): accept a keepalive/manual-resume, or budget ~$25/mo Supabase Pro if adoption is real? → *Keepalive at launch.*
5. **Sync `quest_settings` (minus the API key) or don't sync settings at all** (sidesteps the secret entirely)? → *Sync minus the key.*
6. **Client-side merge + OCC (simpler) vs server-side atomic merge RPC (more correct under heavy contention)?** → *Client-side for launch; add the RPC only if real contention appears.*

---

## Rejected alternatives (for the record)
- **A — Magic-link real accounts:** best recovery/UX (17/25) but introduces email PII — deferred to opt-in recovery, not the launch base.
- **B — Passphrase identity + server-side atomic merge RPC:** most-correct merge (17/25) but needs Supabase Auth + more ops than C; its merge RPC is kept as a documented hardening lever if multi-device contention shows up.
