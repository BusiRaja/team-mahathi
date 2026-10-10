import type { Key } from "./i18n";

export const GROUPS: { key: string; labelKey: Key; icon: string }[] = [
  { key: "all", labelKey: "group.all", icon: "▦" },
  { key: "announcements", labelKey: "group.announcements", icon: "📣" },
  { key: "events", labelKey: "group.events", icon: "🗓️" },
  { key: "photos", labelKey: "group.photos", icon: "🖼️" },
  { key: "videos", labelKey: "group.videos", icon: "▶" },
  { key: "community", labelKey: "group.community", icon: "👥" },
  { key: "notices", labelKey: "group.notices", icon: "🔔" },
];

export const groupOf = (k: string) =>
  k === "event" ? "events" : k === "photos" ? "photos" : k === "video" ? "videos" : k === "community" ? "community" : k === "notice" ? "notices" : "announcements";

export const TAG: Record<string, { labelKey: Key; cls: string }> = {
  events: { labelKey: "tag.events", cls: "bg-burgundy" },
  announcements: { labelKey: "tag.announcements", cls: "bg-saffron-deep" },
  photos: { labelKey: "tag.photos", cls: "bg-burgundy" },
  videos: { labelKey: "tag.videos", cls: "bg-burgundy" },
  notices: { labelKey: "tag.notices", cls: "bg-emerald-700" },
  community: { labelKey: "tag.community", cls: "bg-purple-800" },
};

export const compact = (n = 0) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n));
