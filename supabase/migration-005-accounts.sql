-- Run after migration-004. Visitor accounts (email + phone + password), per-user likes and signed-in comments.
-- Turn on Auth → Providers → Email in Supabase. Phone is stored on the profile as contact info (no SMS verification).

-- ---------- Profiles (one per sign-up) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'phone', nullif(trim(new.raw_user_meta_data->>'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Backfill profiles for users that already exist (e.g. your admin).
insert into public.profiles (id, email, phone, full_name)
select id, email, raw_user_meta_data->>'phone', nullif(trim(raw_user_meta_data->>'full_name'), '')
from auth.users on conflict (id) do nothing;

-- ---------- Likes: one per signed-in user per update ----------
create table if not exists public.update_likes (
  update_id uuid not null references public.updates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (update_id, user_id)
);
alter table public.update_likes enable row level security;
drop policy if exists "read own likes" on public.update_likes;
drop policy if exists "like as self" on public.update_likes;
drop policy if exists "unlike as self" on public.update_likes;
create policy "read own likes" on public.update_likes for select using (user_id = auth.uid());
create policy "like as self" on public.update_likes for insert with check (user_id = auth.uid());
create policy "unlike as self" on public.update_likes for delete using (user_id = auth.uid());

-- updates.likes stays the public counter; existing counts are kept and adjusted by +1 / -1.
create or replace function public.adjust_likes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.updates set likes = likes + 1 where id = new.update_id;
  else update public.updates set likes = greatest(likes - 1, 0) where id = old.update_id; end if;
  return null;
end $$;
drop trigger if exists update_likes_trg on public.update_likes;
create trigger update_likes_trg after insert or delete on public.update_likes for each row execute function public.adjust_likes();

-- Anonymous visitors may still count a view, but can no longer bump likes directly.
create or replace function public.bump_update(p_id uuid, p_field text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_field = 'views' then update public.updates set views = views + 1 where id = p_id; end if;
end $$;
grant execute on function public.bump_update(uuid, text) to anon, authenticated;

-- ---------- Comments: signed-in users only ----------
alter table public.comments add column if not exists user_id uuid references auth.users(id) on delete set null;
drop policy if exists "anyone can comment" on public.comments;
drop policy if exists "signed-in users comment" on public.comments;
create policy "signed-in users comment" on public.comments for insert
  with check (user_id = auth.uid() and hidden = false);
