-- LangLab cross-device sync — accountless "sync code" backend (Approach C).
-- Paste this whole file into the Supabase SQL editor and run it. Region is not
-- security-relevant; pick the one nearest your users (US East for a US/Reddit
-- audience). This design stores no PII, so EU residency isn't required.
--
-- Security model: the sync code is a ~100-bit bearer secret the user copies
-- between devices. It is NEVER stored — only its SHA-256 hash. The tables are
-- RLS deny-all (no policies), so the public anon key cannot touch them
-- directly; ALL access goes through the SECURITY DEFINER functions below,
-- which hash the code, enforce a size cap, and use optimistic concurrency
-- (version check) so a concurrent write returns conflict instead of clobbering.

-- pgcrypto provides digest() for hashing the code.
create extension if not exists pgcrypto with schema extensions;

-- One row per (code, storage-key). k mirrors the app's localStorage keys
-- (quest_mastery_<lang>, quest_stats_<lang>, …, quest_settings). v is the
-- parsed JSON of that key. version drives optimistic concurrency.
create table if not exists public.sync_rows (
  code_hash  text        not null,
  k          text        not null,
  v          jsonb       not null,
  version    bigint      not null default 1,
  updated_at timestamptz not null default now(),
  primary key (code_hash, k)
);

-- Reset epoch per code. resetAll() bumps this so a full-account reset
-- propagates to the OTHER device (union merges cannot express deletion).
create table if not exists public.sync_epoch (
  code_hash text   primary key,
  reset_at  bigint not null default 0   -- client epoch millis of the last reset
);

-- Deny-all: RLS on, no policies → PostgREST refuses all direct anon access.
-- The SECURITY DEFINER functions run as the table owner and bypass RLS.
alter table public.sync_rows  enable row level security;
alter table public.sync_epoch enable row level security;

-- ── helpers ────────────────────────────────────────────────────────────────
create or replace function public._sync_hash(p_code text)
returns text language sql immutable set search_path = extensions as $$
  select encode(digest(p_code, 'sha256'), 'hex')
$$;

-- Guard: reject obviously-invalid codes early (real codes are ~20+ chars).
create or replace function public._sync_guard(p_code text)
returns void language plpgsql immutable as $$
begin
  if p_code is null or length(p_code) < 20 then
    raise exception 'invalid sync code' using errcode = '22023';
  end if;
end $$;

-- ── pull: return everything for this code + the reset epoch ──────────────────
create or replace function public.sync_pull(p_code text)
returns table (k text, v jsonb, version bigint, updated_at timestamptz, reset_at bigint)
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_reset bigint;
begin
  perform public._sync_guard(p_code);
  v_hash := public._sync_hash(p_code);
  select e.reset_at into v_reset from public.sync_epoch e where e.code_hash = v_hash;
  return query
    select s.k, s.v, s.version, s.updated_at, coalesce(v_reset, 0)
    from public.sync_rows s
    where s.code_hash = v_hash;
end $$;

-- ── push one key with optimistic concurrency ────────────────────────────────
-- p_base_version = the version the client last saw for this key (0 for a new
-- key). If the stored version moved on, returns conflict=true and the current
-- version; the client must re-pull, merge, and push again with the new base.
create or replace function public.sync_push(
  p_code text, p_key text, p_value jsonb, p_base_version bigint
)
returns table (version bigint, conflict boolean)
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_current bigint; v_size int;
begin
  perform public._sync_guard(p_code);
  if p_key is null or length(p_key) > 128 then
    raise exception 'invalid key' using errcode = '22023';
  end if;
  -- Per-row size cap (a fully-studied deck is ~1 MB; 4 MB leaves headroom).
  v_size := pg_column_size(p_value);
  if v_size > 4 * 1024 * 1024 then
    raise exception 'payload too large: % bytes', v_size using errcode = '54000';
  end if;
  v_hash := public._sync_hash(p_code);

  select s.version into v_current
    from public.sync_rows s where s.code_hash = v_hash and s.k = p_key;

  if v_current is null then
    insert into public.sync_rows (code_hash, k, v, version, updated_at)
      values (v_hash, p_key, p_value, 1, now());
    return query select 1::bigint, false;
  elsif v_current <> coalesce(p_base_version, 0) then
    return query select v_current, true;               -- conflict — caller re-merges
  else
    update public.sync_rows s
      set v = p_value, version = s.version + 1, updated_at = now()
      where s.code_hash = v_hash and s.k = p_key;
    return query select v_current + 1, false;
  end if;
end $$;

-- ── wipe: full-account reset (resetAll) — clears rows + bumps epoch ──────────
create or replace function public.sync_wipe(p_code text, p_reset_at bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  perform public._sync_guard(p_code);
  v_hash := public._sync_hash(p_code);
  delete from public.sync_rows where code_hash = v_hash;
  insert into public.sync_epoch (code_hash, reset_at)
    values (v_hash, coalesce(p_reset_at, 0))
    on conflict (code_hash)
    do update set reset_at = greatest(public.sync_epoch.reset_at, excluded.reset_at);
end $$;

-- ── grants: expose ONLY the functions to the anon/authenticated roles ───────
revoke all on public.sync_rows  from anon, authenticated;
revoke all on public.sync_epoch from anon, authenticated;
grant execute on function public.sync_pull(text)                        to anon, authenticated;
grant execute on function public.sync_push(text, text, jsonb, bigint)   to anon, authenticated;
grant execute on function public.sync_wipe(text, bigint)                to anon, authenticated;

-- ── LAUNCH GATES (do before going public) ───────────────────────────────────
-- 1. RATE LIMIT sync_pull/sync_push at the Supabase gateway (or add a per-hash
--    counter table) so a code cannot be enumerated / hammered. 100-bit codes
--    are unguessable, so this is defense-in-depth, but still required.
-- 2. PEN TEST: with two codes, confirm code A cannot read code B's rows, and
--    that the anon key cannot select from sync_rows directly (RLS deny-all).
-- 3. Confirm the client STRIPS googleTtsApiKey out of quest_settings before it
--    ever reaches sync_push.
