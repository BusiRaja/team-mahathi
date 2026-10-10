-- Run after migration-002. Public comments on updates, moderated by admins.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.updates(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  body text not null check (char_length(trim(body)) between 1 and 600),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_update_idx on public.comments(update_id, created_at desc);
alter table public.comments enable row level security;

create policy "read visible comments" on public.comments for select using (not hidden or public.is_admin());
create policy "anyone can comment" on public.comments for insert with check (hidden = false);
create policy "admin update comments" on public.comments for update using (public.is_admin()) with check (public.is_admin());
create policy "admin delete comments" on public.comments for delete using (public.is_admin());

-- Keep a visible-comment count on each update so feeds don't have to count rows.
alter table public.updates add column if not exists comments_count int not null default 0;

create or replace function public.refresh_comments_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid := coalesce(new.update_id, old.update_id);
begin
  update public.updates set comments_count = (select count(*) from public.comments where update_id = uid and not hidden) where id = uid;
  return null;
end $$;
drop trigger if exists comments_count_trg on public.comments;
create trigger comments_count_trg after insert or update or delete on public.comments
  for each row execute function public.refresh_comments_count();
