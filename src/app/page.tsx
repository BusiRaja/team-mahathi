import Link from "next/link";
import Countdown from "@/components/Countdown";
import RichText from "@/components/RichText";
import Cover from "@/components/Cover";
import UpdateCard from "@/components/UpdateCard";
import { dayNum, fmtDate, fmtTime, getAlbums, getEvents, getMedia, getSettings, getUpdates, monthShort } from "@/lib/data";
import { isConfigured } from "@/lib/supabase";
import { getT } from "@/lib/i18n/server";
import { eventDescription, eventTitle, eventWhere, localSettings } from "@/lib/i18n/content";
import { toText } from "@/lib/text";
import type { Key } from "@/lib/i18n";

const DEITIES: { key: "ganesha" | "durga"; blurb: Key; mantra: Key; glyph: string; cls: string; btn: string }[] = [
  { key: "ganesha", mantra: "home.ganesha.mantra", blurb: "home.ganesha.blurb", glyph: "🐘", cls: "bg-gradient-to-r from-ivory to-white text-burgundy-dark", btn: "bg-burgundy text-white" },
  { key: "durga", mantra: "home.durga.mantra", blurb: "home.durga.blurb", glyph: "🔱", cls: "bg-gradient-to-r from-burgundy-dark to-burgundy text-ivory", btn: "bg-gold text-burgundy-dark" },
];

export default async function Home() {
  const { t, lang } = await getT();
  const [settings, updates, events, albums, media] = await Promise.all([getSettings(), getUpdates(3), getEvents(), getAlbums(), getMedia({ featured: true, limit: 8 })]);
  const L = localSettings(settings, lang);
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() > Date.now());
  const target = settings.countdown_target || upcoming[0]?.starts_at || "";
  const nextEvent = upcoming[0];
  const nextDesc = nextEvent ? toText(eventDescription(nextEvent, lang)) : "";
  const coverFor = (albumId: string) => media.find((m) => m.album_id === albumId && m.type === "photo")?.url;

  return (
    <div>
      {/* Hero: welcome text on the left, deity image on the right */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF1DD] via-paper to-[#FBE3D3]">
        <div className="wrap grid items-center gap-6 pb-24 pt-10 md:grid-cols-2 md:pt-14">
          <div className="text-center md:text-left">
            <p className="text-sm tracking-[0.4em] text-burgundy/80">{t("home.welcome")}</p>
            <h1 className="mt-1 font-display text-5xl font-black leading-none text-burgundy md:text-7xl">{L.name}</h1>
            <p className="mt-3 text-sm tracking-[0.25em] text-saffron-deep">{L.tagline}</p>
            <p className="mt-5 font-telugu text-xl font-semibold leading-snug text-burgundy md:text-2xl">{L.headline}</p>
            {L.subtitle && <RichText html={L.subtitle} className="mt-2 font-serif text-lg text-burgundy-dark/80" />}
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href="/events" className="btn-royal">🗓️ {t("home.viewEvents")}</Link>
              <Link href="/gallery" className="btn-ghost">🖼️ {t("home.openGallery")}</Link>
            </div>
            {target && <Countdown target={target} label={L.countdownLabel} />}
          </div>
          <div className="relative h-72 overflow-hidden rounded-3xl md:h-[26rem]">
            <Cover src={settings.hero_image} glyph="🔱" className="h-full w-full" width={1100} />
          </div>
        </div>
      </section>

      {/* Deity cards overlap the hero */}
      <section className="wrap -mt-16 grid gap-4 md:grid-cols-2">
        {DEITIES.map((d) => (
          <Link key={d.key} href={`/gallery?deity=${d.key}`} className={`relative overflow-hidden rounded-2xl p-6 shadow-royal ring-2 ring-white transition hover:-translate-y-0.5 ${d.cls}`}>
            <span aria-hidden className="absolute -right-4 -top-4 text-[8rem] opacity-20">{d.glyph}</span>
            <p className="font-serif text-xl text-saffron-deep">{t(d.mantra)}</p>
            <h2 className="font-display text-2xl font-bold">{t(`deity.${d.key}`)}</h2>
            <p className="mt-2 max-w-sm font-serif text-lg leading-snug opacity-90">{t(d.blurb)}</p>
            <span className={`mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${d.btn}`}>{t("home.viewMemories")}</span>
          </Link>
        ))}
      </section>

      <div className="wrap mt-10 grid gap-8 lg:grid-cols-3">
        <section>
          <div className="mb-3 flex items-end justify-between"><h2 className="section-title">{t("home.latest")}</h2><Link href="/updates" className="text-sm font-medium text-burgundy">{t("home.seeAll")}</Link></div>
          <div className="space-y-3">
            {updates.length ? updates.slice(0, 1).map((u) => <UpdateCard key={u.id} u={u} />) : <p className="royal-card p-6 text-center">{t("home.noAnnouncements")}</p>}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between"><h2 className="section-title">{t("home.upcoming")}</h2><Link href="/events" className="text-sm font-medium text-burgundy">{t("home.calendar")}</Link></div>
          {nextEvent ? (
            <Link href={`/events/${nextEvent.id}`} className="royal-card block overflow-hidden transition hover:-translate-y-0.5">
              <Cover src={nextEvent.cover_url} className="h-40 w-full" width={700} />
              <div className="p-4">
                <div className="flex gap-3">
                  <div className="grid h-16 w-14 shrink-0 place-items-center rounded-lg border border-gold/50 text-center"><div><div className="font-display text-2xl font-bold leading-none text-burgundy">{dayNum(nextEvent.starts_at)}</div><div className="text-[10px] tracking-wider">{monthShort(nextEvent.starts_at, lang)}</div></div></div>
                  <div className="min-w-0 text-sm">
                    <h3 className="font-telugu text-lg font-bold leading-snug text-burgundy">{eventTitle(nextEvent, lang)}</h3>
                    <p className="mt-1 text-burgundy/70">{fmtDate(nextEvent.starts_at, lang)} · {fmtTime(nextEvent.starts_at, lang)} 📍 {eventWhere(nextEvent, lang)}</p>
                    
                  </div>
                </div> 
                <span className="btn-royal mt-4 w-full">{t("home.viewEventDetails")}</span>
              </div>
            </Link>
          ) : <p className="royal-card p-6 text-center">{t("home.noUpcoming")}</p>}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between"><h2 className="section-title">{t("home.byYear")}</h2><Link href="/albums" className="text-sm font-medium text-burgundy">{t("home.allAlbums")}</Link></div>
          <div className="grid grid-cols-2 gap-3">
            {albums.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/albums/${a.year}`} className="group relative block overflow-hidden rounded-xl">
                <Cover src={a.cover_url ?? coverFor(a.id)} className="h-28" width={400} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-3 font-display text-2xl font-bold text-white">{a.year}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-12 border-t border-gold/25 bg-white py-4">
        <ul className="wrap flex flex-wrap justify-around gap-4 text-sm font-medium text-burgundy">
          {(["home.stat1", "home.stat2", "home.stat3", "home.stat4"] as Key[]).map((k) => <li key={k}>{t(k)}</li>)}
        </ul>
      </section>
    </div>
  );
}