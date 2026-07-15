-- Verid marketplace — accounts + seller listings (scope expansion, 15 July 2026)
-- Run this in the Supabase SQL Editor (or `supabase db push`) once per project.
-- Idempotent-ish: safe to re-run; uses IF NOT EXISTS / OR REPLACE throughout.
--
-- Two data concerns live in this project (see architecture.md Storage):
--   A. Marketplace host data — profiles + listings (this file), RLS-protected.
--   B. Verid analysis log — risk_logs (created by the backend), PII-free.
-- They are deliberately separate.

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user; seller identity + reputation.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null,
  verified      boolean not null default false,
  rating        numeric(2, 1),                 -- 0.0–5.0, null until rated
  review_count  int not null default 0,
  created_at    timestamptz not null default now()  -- drives sellerAccountAgeDays
);

-- ---------------------------------------------------------------------------
-- listings — a seller's product. Denormalized enough to build an AnalyzeRequest
-- from a single row + its joined profile.
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id                    uuid primary key default gen_random_uuid(),
  seller_id             uuid not null references public.profiles (id) on delete cascade,
  title                 text not null,
  subtitle              text not null default '',
  category              text not null,
  condition             text not null default '',
  location              text not null default '',
  description           text not null,
  price                 int not null,
  category_median_price int not null,
  images                text[] not null default '{}',
  reviews               jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists listings_seller_id_idx on public.listings (seller_id);
create index if not exists listings_created_at_idx on public.listings (created_at desc);

-- ---------------------------------------------------------------------------
-- Row-Level Security
--   Public marketplace: anyone may read profiles + listings.
--   Writes are owner-scoped: a user only writes their own rows.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;

drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users manage their own profile" on public.profiles;
create policy "users manage their own profile"
  on public.profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "listings are readable by everyone" on public.listings;
create policy "listings are readable by everyone"
  on public.listings for select
  using (true);

drop policy if exists "sellers insert their own listings" on public.listings;
create policy "sellers insert their own listings"
  on public.listings for insert
  with check (seller_id = auth.uid());

drop policy if exists "sellers update their own listings" on public.listings;
create policy "sellers update their own listings"
  on public.listings for update
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

drop policy if exists "sellers delete their own listings" on public.listings;
create policy "sellers delete their own listings"
  on public.listings for delete
  using (seller_id = auth.uid());

-- ---------------------------------------------------------------------------
-- On sign-up, create the matching profile row. display_name comes from the
-- sign-up metadata (raw_user_meta_data.display_name), falling back to the email
-- local-part. Runs as definer so it can write the profile under RLS.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
