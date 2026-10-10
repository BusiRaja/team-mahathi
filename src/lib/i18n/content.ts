import { pick, type Lang } from "./index";
import type { Album, FestEvent, FestUpdate, Media, Settings } from "../types";

/** Settings resolved for one language. Telugu falls back to English and vice versa. */
export function localSettings(s: Settings, lang: Lang) {
  const p = (en: string, te: string) => pick(lang, s[en], s[te]);
  return {
    name: p("festival_name", "festival_name_te"),
    tagline: p("tagline", "tagline_line_te"),
    // "tagline_te" is the original Telugu headline setting; "headline" is its English counterpart.
    headline: p("headline", "tagline_te"),
    subtitle: p("subtitle", "subtitle_te"),
    heroScript: p("hero_script", "hero_script_te"),
    countdownLabel: p("countdown_label", "countdown_label_te"),
    motto: p("motto", "motto_te"),
  };
}

export const updateTitle = (u: FestUpdate, lang: Lang) => pick(lang, u.title, u.title_te);
export const updateBody = (u: FestUpdate, lang: Lang) => pick(lang, u.body, u.body_te);
export const eventTitle = (e: FestEvent, lang: Lang) => pick(lang, e.title, e.title_te);
/** The title in the other language, when it exists and differs (shown as a secondary line). */
export const eventAltTitle = (e: FestEvent, lang: Lang) => {
  const alt = lang === "te" ? e.title : e.title_te;
  return alt && alt !== eventTitle(e, lang) ? alt : "";
};
export const eventDescription = (e: FestEvent, lang: Lang) => pick(lang, e.description, e.description_te);
export const eventLocation = (e: FestEvent, lang: Lang) => pick(lang, e.location, e.location_te);
export const eventOrganizer = (e: FestEvent, lang: Lang) => pick(lang, e.organizer, e.organizer_te);
export const eventRoute = (e: FestEvent, lang: Lang) => ({
  start: pick(lang, e.route_start, e.route_start_te),
  via: pick(lang, e.route_via, e.route_via_te),
  end: pick(lang, e.route_end, e.route_end_te),
});
/** "Start → End" for routed events, otherwise the location. */
export function eventWhere(e: FestEvent, lang: Lang) {
  const r = eventRoute(e, lang);
  return r.start ? `${r.start} → ${r.end}` : eventLocation(e, lang);
}
export const eventSchedule = (e: FestEvent, lang: Lang) =>
  (e.schedule ?? []).map((r) => ({ time: r.time, label: pick(lang, r.label, r.label_te) }));
export const eventInfo = (e: FestEvent, lang: Lang): string[] =>
  lang === "te" && e.info_te?.length ? e.info_te : e.info?.length ? e.info : e.info_te ?? [];

export const albumTitle = (a: Album, lang: Lang) => pick(lang, a.title, a.title_te);
export const albumDescription = (a: Album, lang: Lang) => pick(lang, a.description, a.description_te);
export const mediaCaption = (m: Media, lang: Lang) => pick(lang, m.caption, m.caption_te) || null;
