import Link from "next/link";
import Cover from "./Cover";
import { fmtDate } from "@/lib/data";
import { toText } from "@/lib/text";
import type { FestUpdate } from "@/lib/types";

export const GROUPS = [
  { key: "all", label: "All Updates", icon: "▦" },
  { key: "announcements", label: "Announcements", icon: "📣" },
  { key: "events", label: "Events", icon: "🗓️" },
  { key: "photos", label: "Photos", icon: "🖼️" },
  { key: "videos", label: "Videos", icon: "▶" },
  { key: "community", label: "Community", icon: "👥" },
  { key: "notices", label: "Notices", icon: "🔔" },
] as const;

export const groupOf = (k: string) =>
  k === "event" ? "events" : k === "photos" ? "photos" : k === "video" ? "videos" : k === "community" ? "community" : k === "notice" ? "notices" : "announcements";

const TAG: Record<string, { label: string; cls: string }> = {
  events: { label: "Event", cls: "bg-burgundy" },
  announcements: { label: "Announcement", cls: "bg-saffron-deep" },
  photos: { label: "Photos", cls: "bg-burgundy" },
  videos: { label: "Video", cls: "bg-burgundy" },
  notices: { label: "Notice", cls: "bg-emerald-700" },
  community: { label: "Community", cls: "bg-purple-800" },
};

export const compact = (n = 0) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n));

export default function UpdateCard({ u, list = false }: { u: FestUpdate; list?: boolean }) {
  const g = groupOf(u.kind);
  const tag = TAG[g];
  return (
    <Link href={`/updates/${u.id}`} className={`royal-card group flex overflow-hidden transition hover:-translate-y-0.5 ${list ? "flex-row" : "flex-col"}`}>
      <div className={`relative shrink-0 ${list ? "w-40 sm:w-56" : ""}`}>
        <Cover src={u.cover_url} glyph={g === "videos" ? "▶" : "🪔"} className={list ? "h-full min-h-[8rem]" : "h-36"} width={500} />
        <span className={`absolute left-2.5 top-2.5 rounded-md px-2.5 py-1 text-xs font-medium text-white ${tag.cls}`}>{tag.label}</span>
        {u.pinned && <span className="absolute right-2.5 top-2.5 rounded-md bg-gold px-2 py-1 text-[10px] font-semibold text-burgundy-dark">Pinned</span>}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-xs text-burgundy/60"><span aria-hidden>📍 </span>{fmtDate(u.created_at)}</p>
        <h3 className="mt-1 font-telugu text-base font-bold leading-snug text-burgundy">{u.title_te || u.title}</h3>
        {toText(u.body_te || u.body) && <p className="mt-1 line-clamp-2 font-telugu text-sm text-burgundy-dark/70">{toText(u.body_te || u.body)}</p>}
        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-burgundy/70">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full border border-burgundy/50 text-burgundy">→</span>
          <span className="flex gap-3"><span>👁 {compact(u.views)}</span><span>💬 {compact(u.comments_count)}</span><span className="text-burgundy">♥ {compact(u.likes)}</span></span>
        </div>
      </div>
    </Link>
  );
}
