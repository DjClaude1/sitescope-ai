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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
