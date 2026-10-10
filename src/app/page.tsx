import Link from "next/link";
import Countdown from "@/components/Countdown";
import RichText from "@/components/RichText";
import Cover from "@/components/Cover";
import UpdateCard from "@/components/UpdateCard";
import { dayNum, fmtDate, fmtTime, getAlbums, getEvents, getMedia, getSettings, getUpdates, monthShort } from "@/lib/data";
import { isConfigured } from "@/lib/supabase";
import { toText } from "@/lib/rich";

export const revalidate = 30;

const DEITIES = [
  { key: "ganesha", mantra: "ॐ गं गणपतये नमः", name: "Lord Ganesha", blurb: "Vighnaharta, the remover of obstacles. Join the aagman, aarti, modak prasad and the grand visarjan.", glyph: "🐘", cls: "bg-gradient-to-r from-ivory to-white text-burgundy-dark", btn: "bg-burgundy text-white" },
  { key: "durga", mantra: "जय माता दी", name: "Goddess Durgamata", blurb: "Shakti swaroopa, the divine mother. Nine nights of garba, dandiya, pooja and blessings.", glyph: "🔱", cls: "bg-gradient-to-r from-burgundy-dark to-burgundy text-ivory", btn: "bg-gold text-burgundy-dark" },
];

export default async function Home() {
  const [settings, updates, events, albums, media] = await Promise.all([getSettings(), getUpdates(3), getEvents(), getAlbums(), getMedia({ featured: true, limit: 8 })]);
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() > Date.now());
  const target = settings.countdown_target || upcoming[0]?.starts_at || "";
  const nextEvent = upcoming[0];
  const coverFor = (albumId: string) => media.find((m) => m.album_id === albumId && m.type === "photo")?.url;

  return (
    <div> 
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF1DD] via-paper to-[#FBE3D3]">
         <img src="/assets/images/home-back.png" alt="" className="absolute inset-0 h-half w-full object-cover object-top opacity-15 [mask-image:linear-gradient(to_bottom,transparent,black_45%)]" />
        <div className="relative md:max-[75%] wrap grid items-center gap-6 pt-10 md:grid-cols-1 md:pt-14">
          <p className="text-sm tracking-[0.4em] text-burgundy/80">WELCOME TO</p>
          <h1 className="mt-1 font-display text-5xl font-black leading-none text-burgundy md:text-7xl">{settings.festival_name}</h1>
          {settings.tagline && <RichText html={settings.tagline} className="mt-2 font-serif text-lg text-burgundy-dark/80" />}
        </div>
        
        <div className="wrap grid items-center gap-6 pb-24 pt-3 md:grid-cols-2 md:pt-14">
          <div className="text-center md:text-left">  
            <p className="mt-5 font-telugu text-xl font-semibold leading-snug text-burgundy md:text-2xl">{settings.tagline_te}</p>
            {settings.subtitle && <RichText html={settings.subtitle} className="mt-2 font-serif text-lg text-burgundy-dark/80" />}
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href="/events" className="btn-royal">🗓️ View Events →</Link>
              <Link href="/gallery" className="btn-ghost">🖼️ Open Gallery</Link>
            </div>
            {target && <Countdown target={target} label={settings.countdown_label} />}
          </div>
          <div className="relative h-72 overflow-hidden rounded-3xl md:h-[26rem]">
            <Cover src={settings.hero_image}  className="h-full w-full" width={1100} />
            {settings.hero_script && (
              <p className="script-text absolute bottom-5 right-5 -rotate-6 text-right text-3xl leading-tight text-white drop-shadow-lg">{settings.hero_script}</p>
            )}
          </div>
        </div>
      </section>

      {/* Deity cards overlap the hero */}
      <section className="wrap -mt-16 grid gap-4 md:grid-cols-2">
        {DEITIES.map((d) => (
          <Link key={d.key} href={`/gallery?deity=${d.key}`} className={`relative overflow-hidden rounded-2xl p-6 shadow-royal ring-2 ring-white transition hover:-translate-y-0.5 ${d.cls}`}>
            <span aria-hidden className="absolute -right-4 -top-4 text-[8rem] opacity-20">{d.glyph}</span>
            <p className="font-serif text-xl text-saffron-deep">{d.mantra}</p>
            <h2 className="font-display text-2xl font-bold">{d.name}</h2>
            <p className="mt-2 max-w-sm font-serif text-lg leading-snug opacity-90">{d.blurb}</p>
            <span className={`mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${d.btn}`}>View Memories →</span>
          </Link>
        ))}
      </section>
 
      <div className="wrap mt-10 grid gap-8 lg:grid-cols-3">
        <section>
          <div className="mb-3 flex items-end justify-between"><h2 className="section-title">Latest Announcements</h2><Link href="/updates" className="text-sm font-medium text-burgundy">See all →</Link></div>
          <div className="space-y-3">
            {updates.length ? updates.slice(0, 1).map((u) => <UpdateCard key={u.id} u={u} />) : <p className="royal-card p-6 text-center">No announcements yet.</p>}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between"><h2 className="section-title">Upcoming Events</h2><Link href="/events" className="text-sm font-medium text-burgundy">Calendar →</Link></div>
          {nextEvent ? (
            <Link href={`/events/${nextEvent.id}`} className="royal-card block overflow-hidden p-4 transition hover:-translate-y-0.5">
              <div className="flex gap-3">
                <div className="grid h-16 w-14 shrink-0 place-items-center rounded-lg border border-gold/50 text-center"><div><div className="font-display text-2xl font-bold leading-none text-burgundy">{dayNum(nextEvent.starts_at)}</div><div className="text-[10px] tracking-wider">{monthShort(nextEvent.starts_at)}</div></div></div>
                <div className="text-sm">
                  <h3 className="font-telugu text-lg font-bold leading-snug text-burgundy">{nextEvent.title_te || nextEvent.title}</h3>
                  <p className="mt-1 text-burgundy/70">{fmtDate(nextEvent.starts_at)} · {fmtTime(nextEvent.starts_at)}</p>
                  <p className="text-burgundy/70">📍 {nextEvent.route_start ? `${nextEvent.route_start} → ${nextEvent.route_end ?? ""}` : nextEvent.location}</p>
                  <p className="mt-4 line-clamp-6 font-telugu text-sm text-burgundy-dark/70">{toText((nextEvent.description_te || nextEvent.description))}</p>
                </div>
              </div>
              <span className="btn-royal mt-4 w-full">View Event Details →</span>
            </Link>
          ) : <p className="royal-card p-6 text-center">No upcoming events scheduled.</p>}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between"><h2 className="section-title">Memories by Year</h2><Link href="/albums" className="text-sm font-medium text-burgundy">All albums →</Link></div>
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
          {["♾️ Festivals", "👥 People United", "📷 Moments Captured", "🧡 Growing Community"].map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>
    </div>
  );
}
