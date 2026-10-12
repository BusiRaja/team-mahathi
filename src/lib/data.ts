import { unstable_cache } from "next/cache";
import { supabase } from "./supabase";
import { localeOf, type Lang } from "./i18n";
import { demoAlbums, demoEvents, demoMedia, demoSettings, demoUpdates } from "./demo";
import type { Album, FestEvent, FestUpdate, Media, Settings } from "./types";

async function _getSettings(): Promise<Settings> {
  if (!supabase) return demoSettings;
  const { data } = await supabase.from("settings").select("key,value");
  const out: Settings = { ...demoSettings };
  (data ?? []).forEach((r: { key: string; value: string }) => (out[r.key] = r.value));
  return out;
}

async function _getAlbums(): Promise<Album[]> {
  if (!supabase) return demoAlbums;
  const { data } = await supabase.from("albums").select("*").order("year", { ascending: false }).order("created_at", { ascending: true });
  return (data ?? []) as Album[];
}

/** All albums of a year, oldest first. */
async function _getAlbumsByYear(year: number): Promise<Album[]> {
  if (!supabase) return demoAlbums.filter((a) => a.year === year);
  const { data } = await supabase.from("albums").select("*").eq("year", year).order("created_at", { ascending: true });
  return (data ?? []) as Album[];
}

async function _getAlbumById(id: string): Promise<Album | null> {
  if (!supabase) return demoAlbums.find((a) => a.id === id) ?? null;
  const { data } = await supabase.from("albums").select("*").eq("id", id).maybeSingle();
  return (data as Album) ?? null;
}

async function _getMedia(opts: { albumId?: string; featured?: boolean; limit?: number } = {}): Promise<Media[]> {
  if (!supabase) return demoMedia;
  let q = supabase.from("media").select("*").order("created_at", { ascending: false });
  if (opts.albumId) q = q.eq("album_id", opts.albumId);
  if (opts.featured) q = q.eq("featured", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as Media[];
}

async function _getUpdates(limit?: number): Promise<FestUpdate[]> {
  if (!supabase) return limit ? demoUpdates.slice(0, limit) : demoUpdates;
  let q = supabase
    .from("updates")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []) as FestUpdate[];
}

async function _getEvents(): Promise<FestEvent[]> {
  if (!supabase) return demoEvents;
  const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
  return (data ?? []) as FestEvent[];
}

const tz = "Asia/Kolkata";
export const fmtDate = (iso: string, lang: Lang = "en") =>
  new Date(iso).toLocaleDateString(localeOf(lang), { day: "numeric", month: "short", year: "numeric", timeZone: tz });
export const fmtTime = (iso: string, lang: Lang = "en") =>
  new Date(iso).toLocaleTimeString(localeOf(lang), { hour: "numeric", minute: "2-digit", timeZone: tz });
export const fmtWeekday = (iso: string, lang: Lang = "en") =>
  new Date(iso).toLocaleDateString(localeOf(lang), { weekday: "long", timeZone: tz });
export const dayNum = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", timeZone: tz });
export const monthShort = (iso: string, lang: Lang = "en") =>
  new Date(iso).toLocaleDateString(localeOf(lang), { month: "short", timeZone: tz }).toUpperCase();

async function _getEventById(id: string): Promise<FestEvent | null> {
  if (!supabase) return demoEvents.find((e) => e.id === id) ?? null;
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  return (data as FestEvent) ?? null;
}

async function _getUpdateById(id: string): Promise<FestUpdate | null> {
  if (!supabase) return demoUpdates.find((u) => u.id === id) ?? null;
  const { data } = await supabase.from("updates").select("*").eq("id", id).maybeSingle();
  return (data as FestUpdate) ?? null;
}

// Pages read the language cookie, so they render per request. Cache the database reads for 30s to keep that cheap.
const c = <A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string) => unstable_cache(fn, [key], { revalidate: 30 });
export const getSettings = c(_getSettings, "settings");
export const getAlbums = c(_getAlbums, "albums");
export const getAlbumsByYear = c(_getAlbumsByYear, "albums-by-year");
export const getAlbumById = c(_getAlbumById, "album-by-id");
export const getMedia = c(_getMedia, "media");
export const getUpdates = c(_getUpdates, "updates");
export const getEvents = c(_getEvents, "events");
export const getEventById = c(_getEventById, "event-by-id");
export const getUpdateById = c(_getUpdateById, "update-by-id");
