import { supabase } from "./supabase";
import { demoAlbums, demoEvents, demoMedia, demoSettings, demoUpdates } from "./demo";
import type { Album, FestEvent, FestUpdate, Media, Settings } from "./types";

export async function getSettings(): Promise<Settings> {
  if (!supabase) return demoSettings;
  const { data } = await supabase.from("settings").select("key,value");
  const out: Settings = { ...demoSettings };
  (data ?? []).forEach((r: { key: string; value: string }) => (out[r.key] = r.value));
  return out;
}

export async function getAlbums(): Promise<Album[]> {
  if (!supabase) return demoAlbums;
  const { data } = await supabase.from("albums").select("*").order("year", { ascending: false });
  return (data ?? []) as Album[];
}

export async function getAlbumByYear(year: number): Promise<Album | null> {
  if (!supabase) return demoAlbums.find((a) => a.year === year) ?? null;
  const { data } = await supabase.from("albums").select("*").eq("year", year).maybeSingle();
  return (data as Album) ?? null;
}

export async function getMedia(opts: { albumId?: string; featured?: boolean; limit?: number } = {}): Promise<Media[]> {
  if (!supabase) return demoMedia;
  let q = supabase.from("media").select("*").order("created_at", { ascending: false });
  if (opts.albumId) q = q.eq("album_id", opts.albumId);
  if (opts.featured) q = q.eq("featured", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data ?? []) as Media[];
}

export async function getUpdates(limit?: number): Promise<FestUpdate[]> {
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

export async function getEvents(): Promise<FestEvent[]> {
  if (!supabase) return demoEvents;
  const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
  return (data ?? []) as FestEvent[];
}

export const deityLabel = (d: string) =>
  d === "ganesha" ? "Lord Ganesha" : d === "durga" ? "Goddess Durgamata" : "All Deities";

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export const fmtWeekday = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
export const dayNum = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" });
export const monthShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).toUpperCase();

export async function getEventById(id: string): Promise<FestEvent | null> {
  if (!supabase) return demoEvents.find((e) => e.id === id) ?? null;
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  return (data as FestEvent) ?? null;
}

export async function getUpdateById(id: string): Promise<FestUpdate | null> {
  if (!supabase) return demoUpdates.find((u) => u.id === id) ?? null;
  const { data } = await supabase.from("updates").select("*").eq("id", id).maybeSingle();
  return (data as FestUpdate) ?? null;
}
