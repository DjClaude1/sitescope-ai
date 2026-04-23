-- SiteScope AI — Supabase schema
-- Run this in the Supabase SQL editor after creating a project.

-- =====================================================================
-- Profiles (one row per Supabase auth user)
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  plan text not null default 'free' check (plan in ('free','pro')),
  paypal_subscription_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent migrations for projects created before Stripe columns existed.
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;

-- Keep email in sync with auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- Audits (reports)
-- =====================================================================
create table if not exists public.audits (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  url text not null,
  final_url text,
  title text,
  overall_score int,
  report jsonb not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists audits_user_id_idx on public.audits (user_id);
create index if not exists audits_created_at_idx on public.audits (created_at desc);

-- =====================================================================
-- Daily usage (rate limiting)
-- =====================================================================
create table if not exists public.usage (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  ip text,
  day date not null,
  count int not null default 0
);
create unique index if not exists usage_user_day_idx
  on public.usage (user_id, day) where user_id is not null;
create unique index if not exists usage_ip_day_idx
  on public.usage (ip, day) where user_id is null;

-- Atomic daily-counter increment. Safe under concurrent calls because the
-- INSERT ... ON CONFLICT DO UPDATE expression is evaluated atomically by
-- Postgres against the conflicting row.
create or replace function public.increment_usage(
  p_user_id uuid,
  p_ip text,
  p_day date
) returns void as $$
begin
  if p_user_id is not null then
    insert into public.usage (user_id, ip, day, count)
    values (p_user_id, p_ip, p_day, 1)
    on conflict (user_id, day) where user_id is not null
    do update set count = public.usage.count + 1;
  else
    insert into public.usage (user_id, ip, day, count)
    values (null, p_ip, p_day, 1)
    on conflict (ip, day) where user_id is null
    do update set count = public.usage.count + 1;
  end if;
end;
$$ language plpgsql security definer;

-- Atomic check-and-increment for free-tier rate limiting.
-- Returns (allowed, new_count). If new_count would exceed p_limit, the
-- update is blocked by the WHERE clause and allowed is false — no TOCTOU
-- window because INSERT...ON CONFLICT DO UPDATE is evaluated atomically.
create or replace function public.reserve_audit(
  p_user_id uuid,
  p_ip text,
  p_day date,
  p_limit int
) returns table(allowed boolean, new_count int) as $$
declare
  new_cnt int;
  cur_cnt int;
begin
  if p_user_id is not null then
    insert into public.usage (user_id, ip, day, count)
    values (p_user_id, p_ip, p_day, 1)
    on conflict (user_id, day) where user_id is not null
    do update set count = public.usage.count + 1
      where public.usage.count < p_limit
    returning count into new_cnt;
  else
    insert into public.usage (user_id, ip, day, count)
    values (null, p_ip, p_day, 1)
    on conflict (ip, day) where user_id is null
    do update set count = public.usage.count + 1
      where public.usage.count < p_limit
    returning count into new_cnt;
  end if;

  if new_cnt is not null then
    return query select true, new_cnt;
    return;
  end if;

  -- WHERE clause blocked the update — limit already reached.
  if p_user_id is not null then
    select count into cur_cnt from public.usage
      where user_id = p_user_id and day = p_day;
  else
    select count into cur_cnt from public.usage
      where ip = p_ip and day = p_day and user_id is null;
  end if;
  return query select false, coalesce(cur_cnt, p_limit);
end;
$$ language plpgsql security definer;

-- Soft decrement — never below zero. Used to refund a reservation if the
-- audit itself fails after we've already charged the user's quota.
create or replace function public.refund_usage(
  p_user_id uuid,
  p_ip text,
  p_day date
) returns void as $$
begin
  if p_user_id is not null then
    update public.usage set count = greatest(count - 1, 0)
      where user_id = p_user_id and day = p_day;
  else
    update public.usage set count = greatest(count - 1, 0)
      where ip = p_ip and day = p_day and user_id is null;
  end if;
end;
$$ language plpgsql security definer;

-- =====================================================================
-- Monitors (Pro: weekly re-audit + email)
-- =====================================================================
create table if not exists public.monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  last_score int,
  last_audited_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists monitors_user_id_idx on public.monitors (user_id);

-- =====================================================================
-- Row level security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.audits enable row level security;
alter table public.usage enable row level security;
alter table public.monitors enable row level security;

-- Profiles: user reads/updates their own row
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

-- Audits: anyone can read a public audit by id; owners can list their own.
drop policy if exists "audits public read" on public.audits;
create policy "audits public read" on public.audits
  for select using (is_public = true);

drop policy if exists "audits owner all" on public.audits;
create policy "audits owner all" on public.audits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Usage & monitors are user-scoped
drop policy if exists "usage self" on public.usage;
create policy "usage self" on public.usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "monitors self" on public.monitors;
create policy "monitors self" on public.monitors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
