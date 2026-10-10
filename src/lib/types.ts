export type Deity = "ganesha" | "durga" | "both";
export type Category =
  | "general" | "aagman" | "pooja" | "aarti" | "decoration"
  | "dj" | "procession" | "immersion" | "prasad";
export type UpdateKind =
  | "general" | "aagman" | "pooja" | "dj" | "procession" | "immersion"
  | "event" | "photos" | "video" | "notice" | "community";
export type EventCategory = "general" | "procession" | "pooja" | "community";

export interface Album {
  id: string;
  year: number;
  title: string;
  description: string | null;
  cover_url: string | null;
}
export interface Media {
  id: string;
  album_id: string;
  type: "photo" | "video";
  url: string;
  storage_path?: string | null;
  category: Category;
  deity: Deity;
  caption: string | null;
  featured: boolean;
  created_at: string;
}
export interface FestUpdate {
  id: string;
  kind: UpdateKind;
  deity: Deity;
  title: string;
  title_te?: string | null;
  body: string | null;
  body_te?: string | null;
  cover_url?: string | null;
  event_id?: string | null;
  pinned: boolean;
  views?: number;
  likes?: number;
  comments_count?: number;
  created_at: string;
}
export interface Comment {
  id: string;
  update_id: string;
  name: string;
  body: string;
  hidden: boolean;
  created_at: string;
}
export interface FestEvent {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  location: string | null;
  deity: Deity;
  title_te?: string | null;
  description_te?: string | null;
  category?: EventCategory;
  cover_url?: string | null;
  route_start?: string | null;
  route_via?: string | null;
  route_end?: string | null;
  organizer?: string | null;
  schedule?: { time: string; label: string }[] | null;
  info?: string[] | null;
}
export type Settings = Record<string, string>;

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "general", label: "General" },
  { value: "aagman", label: "Aagman" },
  { value: "pooja", label: "Pooja" },
  { value: "aarti", label: "Aarti" },
  { value: "decoration", label: "Decoration" },
  { value: "dj", label: "DJ Night" },
  { value: "procession", label: "Procession" },
  { value: "immersion", label: "Immersion" },
  { value: "prasad", label: "Prasad" },
];
export const UPDATE_KINDS: { value: UpdateKind; label: string }[] = [
  { value: "general", label: "Announcement" },
  { value: "aagman", label: "Aagman" },
  { value: "pooja", label: "Pooja Schedule" },
  { value: "dj", label: "DJ Event" },
  { value: "procession", label: "Procession" },
  { value: "immersion", label: "Immersion" },
  { value: "event", label: "Event" },
  { value: "photos", label: "Photos" },
  { value: "video", label: "Video" },
  { value: "notice", label: "Notice" },
  { value: "community", label: "Community" },
];
export const DEITIES: { value: Deity; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "ganesha", label: "Lord Ganesha" },
  { value: "durga", label: "Goddess Durgamata" },
];
