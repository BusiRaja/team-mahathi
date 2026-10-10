-- Run after schema.sql. Adds the fields the redesigned pages use. All new columns are optional.

alter table public.events
  add column if not exists title_te text,
  add column if not exists description_te text,
  add column if not exists category text not null default 'general'
    check (category in ('general','procession','pooja','community')),
  add column if not exists cover_url text,
  add column if not exists route_start text,
  add column if not exists route_via text,
  add column if not exists route_end text,
  add column if not exists organizer text,
  add column if not exists schedule jsonb,   -- [{"time":"6:30 PM","label":"Bhaktha gathering"}]
  add column if not exists info jsonb;       -- ["All are welcome", "Avoid plastic"]

alter table public.updates
  add column if not exists title_te text,
  add column if not exists body_te text,
  add column if not exists cover_url text,
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists views int not null default 0,
  add column if not exists likes int not null default 0;

alter table public.updates drop constraint if exists updates_kind_check;
alter table public.updates add constraint updates_kind_check check (kind in
  ('general','aagman','pooja','dj','procession','immersion','event','photos','video','notice','community'));

-- Public counters: visitors can only bump views/likes by 1, nothing else.
create or replace function public.bump_update(p_id uuid, p_field text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_field = 'views' then update public.updates set views = views + 1 where id = p_id;
  elsif p_field = 'likes' then update public.updates set likes = likes + 1 where id = p_id;
  end if;
end $$;
grant execute on function public.bump_update(uuid, text) to anon, authenticated;

-- Email subscribers: anyone can subscribe, only admins can read or remove.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (position('@' in email) > 1),
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
create policy "anyone subscribes" on public.subscribers for insert with check (true);
create policy "admin reads subscribers" on public.subscribers for select using (public.is_admin());
create policy "admin deletes subscribers" on public.subscribers for delete using (public.is_admin());

insert into public.settings (key, value) values
  ('motto_te', 'భక్తి... సంప్రదాయం... ఐక్యతలో... అమ్మవారి ఆగమనాన్ని కలిసికట్టుగా స్వాగతిద్దాం!'),
  ('hero_script', 'Get Ready, Amma Is Coming'),
  ('hero_image', ''),
  ('join_url', '')
on conflict (key) do nothing;
