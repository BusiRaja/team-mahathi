-- Run after migration-003. Adds optional Telugu columns so every visitor-facing field can be shown in English or Telugu.
-- All columns are nullable; when the Telugu value is empty the site falls back to English (and vice versa).

alter table public.albums
  add column if not exists title_te text,
  add column if not exists description_te text;

alter table public.media
  add column if not exists caption_te text;

alter table public.events
  add column if not exists location_te text,
  add column if not exists route_start_te text,
  add column if not exists route_via_te text,
  add column if not exists route_end_te text,
  add column if not exists organizer_te text,
  add column if not exists info_te jsonb;          -- ["అందరికీ స్వాగతం", ...]
-- events.schedule items may now carry "label_te": [{"time":"6:30 PM","label":"...","label_te":"..."}]

-- Settings is key/value, so new keys need no schema change. Keys read by the site:
--   festival_name_te, tagline_line_te, headline, tagline_te, subtitle_te, hero_script_te, countdown_label_te, motto
