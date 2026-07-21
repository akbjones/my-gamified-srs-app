-- LangLab sync hardening (P5 launch gates) — paste into the Supabase SQL editor
-- and run, same as 0001. Adds:
--   1. A per-IP sliding-window rate limit on all three sync RPCs (defense in
--      depth against code enumeration / hammering; codes are ~100-bit so
--      enumeration is already infeasible, this bounds abuse traffic).
--   2. A per-code key-count cap in sync_push (a code can hold at most 150
--      rows; the real app writes ~113 max = 8 keys x 14 languages + settings)
--      so junk data can't be parked in the table.
--
-- Limit: 200 calls/min per IP. A worst-case legitimate burst (first enable on
-- a 14-language account = ~113 pushes + pull) fits inside one window.

create table if not exists public.sync_ratelimit (
  bucket       text        primary key,   -- caller IP (first hop of x-forwarded-for)
  window_start timestamptz not null,
  hits         int         not null
);
alter table public.sync_ratelimit enable row level security;  -- deny-all, same as the others
revoke all on public.sync_ratelimit from anon, authenticated;

create or replace function public._sync_ratelimit()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_ip   text;
  v_now  timestamptz := now();
  v_hits int;
begin
  -- PostgREST exposes request headers as a GUC; take the client hop.
  v_ip := coalesce(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), 'unknown');
  insert into public.sync_ratelimit as r (bucket, window_start, hits)
    values (v_ip, v_now, 1)
  on conflict (bucket) do update set
    hits         = case when r.window_start < v_now - interval '60 seconds' then 1 else r.hits + 1 end,
    window_start = case when r.window_start < v_now - interval '60 seconds' then v_now else r.window_start end
  returning r.hits into v_hits;
  if v_hits > 200 then
    raise exception 'rate limit exceeded — retry in a minute' using errcode = '54000';
  end if;
  -- Opportunistic cleanup so the table stays tiny.
  if random() < 0.01 then
    delete from public.sync_ratelimit where window_start < v_now - interval '1 hour';
  end if;
end $$;

-- ── recreate the three RPCs with the rate limit as the first step ───────────

create or replace function public.sync_pull(p_code text)
returns table (k text, v jsonb, version bigint, updated_at timestamptz, reset_at bigint)
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_reset bigint;
begin
  perform public._sync_ratelimit();
  perform public._sync_guard(p_code);
  v_hash := public._sync_hash(p_code);
  select e.reset_at into v_reset from public.sync_epoch e where e.code_hash = v_hash;
  return query
    select s.k, s.v, s.version, s.updated_at, coalesce(v_reset, 0)
    from public.sync_rows s
    where s.code_hash = v_hash;
end $$;

create or replace function public.sync_push(
  p_code text, p_key text, p_value jsonb, p_base_version bigint
)
returns table (version bigint, conflict boolean)
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_current bigint; v_size int; v_keys int;
begin
  perform public._sync_ratelimit();
  perform public._sync_guard(p_code);
  if p_key is null or length(p_key) > 128 then
    raise exception 'invalid key' using errcode = '22023';
  end if;
  v_size := pg_column_size(p_value);
  if v_size > 4 * 1024 * 1024 then
    raise exception 'payload too large: % bytes', v_size using errcode = '54000';
  end if;
  v_hash := public._sync_hash(p_code);

  select s.version into v_current
    from public.sync_rows s where s.code_hash = v_hash and s.k = p_key;

  if v_current is null then
    -- Key-count cap: a code may hold at most 150 rows.
    select count(*) into v_keys from public.sync_rows where code_hash = v_hash;
    if v_keys >= 150 then
      raise exception 'too many keys for this code' using errcode = '54000';
    end if;
    insert into public.sync_rows (code_hash, k, v, version, updated_at)
      values (v_hash, p_key, p_value, 1, now());
    return query select 1::bigint, false;
  elsif v_current <> coalesce(p_base_version, 0) then
    return query select v_current, true;
  else
    update public.sync_rows s
      set v = p_value, version = s.version + 1, updated_at = now()
      where s.code_hash = v_hash and s.k = p_key;
    return query select v_current + 1, false;
  end if;
end $$;

create or replace function public.sync_wipe(p_code text, p_reset_at bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  perform public._sync_ratelimit();
  perform public._sync_guard(p_code);
  v_hash := public._sync_hash(p_code);
  delete from public.sync_rows where code_hash = v_hash;
  insert into public.sync_epoch (code_hash, reset_at)
    values (v_hash, coalesce(p_reset_at, 0))
    on conflict (code_hash)
    do update set reset_at = greatest(public.sync_epoch.reset_at, excluded.reset_at);
end $$;

-- Grants unchanged (functions already granted in 0001; create-or-replace keeps them).
