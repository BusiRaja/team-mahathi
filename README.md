# Utsav — Ganesh & Durga Festival App

Next.js 15 + Tailwind + Framer Motion + Supabase (Postgres, Auth) + Cloudinary (photo/video storage).
Theme: royal burgundy, saffron, gold, ivory with dedicated Lord Ganesha and Goddess Durgamata sections.

## Features
- **Home** — festival hero, live countdown, deity sections, announcements, upcoming events, year shortcuts
- **Albums** — year-wise (2026, 2025, 2024 and earlier)
- **Gallery** — photos/videos, filters (deity, category, type), full-screen lightbox with swipe, share, save
- **Updates** — Aagman, pooja schedules, DJ events, processions, immersion
- **Events** — calendar with dates, timings, locations
- **Admin** (`/admin`) — Supabase Auth login; upload media, manage albums, updates, events and home settings

## Setup
1. Create a Supabase project.
2. SQL Editor → run, in order: `supabase/schema.sql`, `supabase/migration-002-mockup-fields.sql` (route/Telugu/engagement fields, subscribers), `supabase/migration-003-comments.sql` (moderated comments), `supabase/migration-004-multilanguage.sql` (Telugu versions of every content field).
3. Auth → Users → add an admin user (email + password), then run:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
   ```
4. Cloudinary Dashboard → copy Cloud name, API Key, API Secret.
5. Copy `.env.example` to `.env.local` and fill in the Supabase and Cloudinary values.
6. `npm install && npm run dev`

## Language, likes, views and comments
- **Language switch:** the header has an EN | తెలుగు toggle. The choice is saved in a `lang` cookie (first visit follows the browser language), and every page, including server-rendered content, is shown in that language. UI text lives in `src/lib/i18n/en.ts` and `te.ts`; add a key to both. Dates, weekdays and months follow the language too.
- **Bilingual content:** admin has English and Telugu inputs for updates, events (title, description, place, route, organizer, schedule, info), albums, media captions and home-page settings. Visitors see their chosen language and fall back to the other one when a field is empty. Run `supabase/migration-004-multilanguage.sql` to add the new Telugu columns.
- Views (once per browser session) and likes (once per browser) are stored in `updates`. Comments are public, validated in the database, and can be hidden or deleted in Admin → Comments. A honeypot and a 20-second cooldown deter spam; add a CAPTCHA if the site gets abused.

## Admin editing
Every admin list has Edit: albums, updates, events (and media captions, category, deity and album). Edit loads the record into the form; Save changes updates it, Cancel discards. Subtitle and quote in Settings use the rich editor. The Join Team button and link are hidden while anyone is signed in.

## Rich text
Update details and event descriptions use a Tiptap editor (formatting, headings, lists, quote, alignment, links, images uploaded to Cloudinary, dividers, tables). HTML is sanitized on the server before it is shown, and older plain-text entries still display correctly.

## Media storage (Cloudinary)
Photos and videos upload to Cloudinary under `utsav/<year>/`. The browser asks `/api/cloudinary/sign`
(admin-only, verified against Supabase) for a signed upload, then sends the file straight to Cloudinary.
The API secret never reaches the browser. Deleting media or an album also removes the files from Cloudinary.
Gallery images are served with `f_auto,q_auto` and width limits for fast loading. Supabase keeps only the
metadata (URL, Cloudinary public_id in `storage_path`, category, deity, caption).
The Supabase storage bucket in `schema.sql` is no longer used and can be ignored.

Without env vars the app runs in preview mode with sample data.

## Security
Everyone can read; only users listed in `public.admins` can insert/update/delete rows or storage objects (enforced by RLS, not just the UI).

## Deploy
Push to Vercel and add the two env vars.
