import type { Album, FestEvent, FestUpdate, Media, Settings } from "./types";

// Shown only when Supabase env vars are missing, so the UI is previewable out of the box.
const y = new Date().getFullYear();
const daysFromNow = (d: number, h = 18) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

export const demoSettings: Settings = {
  festival_name: "Team Mahathi",
  tagline: "Festivals • Friendship • Fearless Faith",
  tagline_te: "భక్తి... సంప్రదాయం... ఐక్యతతో... మన మహతి ప్రత్యేకత!",
  subtitle: "Youth bringing tradition to life • Gajwel • Culture • Community",
  countdown_label: "Amma arrives in",
  countdown_target: "",
  hero_script: "Get Ready, Amma Is Coming",
  hero_image: "",
  motto_te: "భక్తి... సంప్రదాయం... ఐక్యతలో... అమ్మవారి ఆగమనాన్ని కలిసికట్టుగా స్వాగతిద్దాం!",
  join_url: "",
};

export const demoAlbums: Album[] = [y, y - 1, y - 2, y - 3].map((year, i) => ({
  id: `demo-album-${year}`,
  year,
  title: `Festival ${year}`,
  description: i === 0 ? "This year's celebrations" : "Cherished memories",
  cover_url: null,
}));

export const demoMedia: Media[] = [];

const at = (d: string, t: string) => `2026-10-${d}T${t}:00+05:30`;
const route = { route_start: "Ayyappa Temple", route_via: "Shivalayam Temple", route_end: "Behind Mahathi Auditorium, Gajwel", organizer: "Team Mahathi" };

export const demoEvents: FestEvent[] = [
  { id: "e1", title: "Goddess Durga Mata Aagamanam", title_te: "శ్రీ దుర్గా మాత ఆగమనం", description: "Let us welcome Amma together.", description_te: "<h2 style=\"text-align: center\">అమ్మవారి ఆగమనం</h2><p>అమ్మవారి ఆగమనాన్ని <strong>కలిసికట్టుగా</strong> స్వాగతిద్దాం.</p><ul><li><p>మంగళ హారతులతో రండి</p></li><li><p>సాంప్రదాయ వస్త్రధారణ</p></li></ul><table><tbody><tr><th><p>సమయం</p></th><th><p>కార్యక్రమం</p></th></tr><tr><td><p>7:00 PM</p></td><td><p>శోభాయాత్ర</p></td></tr></tbody></table>", starts_at: at("09", "19:00"), location: "Gajwel", deity: "durga", category: "general", ...route,
    schedule: [{ time: "6:30 PM", label: "Bhaktha gathering at Ayyappa Temple" }, { time: "7:00 PM", label: "Shobha Yatra begins (Ayyappa Temple)" }, { time: "7:30 PM", label: "Via Shivalayam Temple" }, { time: "8:00 PM", label: "Arrival at Mahathi Auditorium (Behind)" }, { time: "8:30 PM", label: "Pooja, Harathi & cultural program" }],
    info: ["All are welcome", "Traditional attire preferred", "Follow safety guidelines", "Avoid plastic", "Stay with Team volunteers", "Photos and videos will be shared"] },
  { id: "e2", title: "Shobha Yatra", title_te: "శోభాయాత్ర", description_te: "భక్తి, వైభవం, ఆధ్యాత్మికతకు ప్రతీకగా వరంవరుగత శోభాయాత్ర.", description: "A grand procession of devotion and togetherness.", starts_at: at("11", "18:30"), location: "Main Roads, Gajwel", deity: "durga", category: "procession", ...route, info: null, schedule: null },
  { id: "e3", title: "Maha Harathi", title_te: "మహా హారతి", description: "A special harathi for Amma. Everyone is invited.", description_te: "అమ్మవారికి విశేష మహాహారతి కార్యక్రమం. అందరినీ ఆహ్వానిస్తున్నాం.", starts_at: at("12", "19:00"), location: "Mahathi Auditorium, Gajwel", deity: "durga", category: "pooja", organizer: "Team Mahathi", schedule: null, info: null },
  { id: "e4", title: "Navaratri Celebrations", title_te: "నవరాత్రి ఉత్సవాలు", starts_at: at("15", "19:00"), location: "Mahathi Auditorium", deity: "durga", category: "community", description: null },
  { id: "e5", title: "Durga Mata Immersion", title_te: "దుర్గా మాత నిమజ్జనం", starts_at: at("24", "17:00"), location: "Godavari Ghat, Gajwel", deity: "durga", category: "procession", description: null },
];

export const demoUpdates: FestUpdate[] = [
  { id: "u1", kind: "event", deity: "durga", title: "Goddess Durga Mata Aagamanam", title_te: "శ్రీ దుర్గా మాత ఆగమన మహోత్సవం", body: "9 Oct, 7:00 PM. Amma's arrival procession.", body_te: "9 Oct, సాయంత్రం 7:00 గంటలకు అమ్మవారి ఆగమన యాత్ర.", pinned: true, event_id: "e1", views: 1400, likes: 246, created_at: at("10", "09:00") },
  { id: "u2", kind: "general", deity: "durga", title: "Get Ready. Amma Is Coming. 🔥🙏", body: "Everyone get ready to welcome Amma.", body_te: "అమ్మవారి ఆగమనానికి అందరూ సిద్ధంగా ఉండండి!", pinned: false, views: 2100, likes: 362, created_at: at("08", "09:00") },
  { id: "u3", kind: "photos", deity: "durga", title: "Amma's Alankaram", title_te: "అమ్మవారి అలంకారం", body: "This year's special alankaram.", body_te: "ఈ సంవత్సరపు ప్రత్యేక అలంకారం – సుందర దర్శనం ✨", pinned: false, views: 3800, likes: 512, created_at: at("07", "09:00") },
  { id: "u4", kind: "video", deity: "durga", title: "Aagamana Yatra – Teaser", title_te: "ఆగమన యాత్ర – టీజర్", body: "Team Mahathi", pinned: false, views: 5100, likes: 688, created_at: at("07", "08:00") },
  { id: "u5", kind: "notice", deity: "durga", title: "Yatra Route Details", title_te: "యాత్ర మార్గం వివరాలు", body: "From Ayyappa Temple via Shivalayam to Mahathi Auditorium.", body_te: "అయ్యప్ప దేవాలయం నుండి శివాలయం మీదుగా...", pinned: false, views: 980, likes: 154, created_at: at("06", "09:00") },
  { id: "u6", kind: "community", deity: "both", title: "Our Volunteers – Team Mahathi", title_te: "మన మహతి యువతులు, యువకుల సేవాస్ఫూర్తి.", body: "Our youth volunteers.", pinned: false, views: 1200, likes: 298, created_at: at("05", "09:00") },
];
