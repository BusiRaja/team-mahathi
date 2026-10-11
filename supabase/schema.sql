-- Utsav Festival App: run this whole file in Supabase → SQL Editor.

create extension if not exists "pgcrypto";

-- ---------- Admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create policy "admins can read own row" on public.admins
  for select using (user_id = auth.uid());

-- ---------- Settings (key/value) ----------
create table if not exists public.settings (
  key text primary key,
  value text not null
);

-- ---------- Albums (year-wise) ----------
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  title text not null,
  description text,
  cover_url text,
  created_at timestamptz not null default now()
);

-- ---------- Media ----------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  type text not null check (type in ('photo','video')),
  url text not null,
  storage_path text,
  category text not null default 'general'
    check (category in ('general','aagman','pooja','aarti','decoration','dj','procession','immersion','prasad')),
  deity text not null default 'both' check (deity in ('ganesha','durga','both')),
  caption text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists media_album_idx on public.media(album_id);

-- ---------- Updates ----------
create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'general'
    check (kind in ('general','aagman','pooja','dj','procession','immersion')),
  deity text not null default 'both' check (deity in ('ganesha','durga','both')),
  title text not null,
  body text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Events ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  location text,
  deity text not null default 'both' check (deity in ('ganesha','durga','both')),
  created_at timestamptz not null default now()
);

-- ---------- RLS: public read, admin write ----------
do $$
declare t text;
begin
  foreach t in array array['settings','albums','media','updates','events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read %1$s" on public.%1$I for select using (true)', t);
    execute format('create policy "admin insert %1$s" on public.%1$I for insert with check (public.is_admin())', t);
    execute format('create policy "admin update %1$s" on public.%1$I for update using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admin delete %1$s" on public.%1$I for delete using (public.is_admin())', t);
  end loop;
end $$;

-- ---------- Storage bucket for photos / videos ----------
insert into storage.buckets (id, name, public)
values ('festival-media', 'festival-media', true)
on conflict (id) do nothing;

create policy "public read festival media" on storage.objects
  for select using (bucket_id = 'festival-media');
create policy "admin upload festival media" on storage.objects
  for insert with check (bucket_id = 'festival-media' and public.is_admin());
create policy "admin update festival media" on storage.objects
  for update using (bucket_id = 'festival-media' and public.is_admin());
create policy "admin delete festival media" on storage.objects
  for delete using (bucket_id = 'festival-media' and public.is_admin());

-- ---------- Seed settings ----------
insert into public.settings (key, value) values
  ('festival_name', 'Utsav'),
  ('tagline', 'Ganpati Bappa Morya · Jai Mata Di'),
  ('countdown_label', 'Next celebration begins in'),
  ('countdown_target', '')
on conflict (key) do nothing;

-- ---------- After creating your admin user in Auth → Users, run: ----------
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'you@example.com';
