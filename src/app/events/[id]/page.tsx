import Link from "next/link";
import { notFound } from "next/navigation";
import RichText from "@/components/RichText";
import { toText } from "@/lib/rich";
import Cover from "@/components/Cover";
import EventActions from "@/components/EventActions";
import { QuickLinks } from "@/components/EventsExplorer";
import { dayNum, fmtTime, fmtWeekday, getEventById, getEvents, getSettings, monthShort } from "@/lib/data";

export const revalidate = 30;

const VALUES = [["🙏", "భక్తి", "Devotion"], ["👥", "సంప్రదాయం", "Tradition"], ["🤝", "ఐక్యత", "Togetherness"], ["🪷", "ఆధ్యాత్మికత", "Spirituality"]];
const DEFAULT_INFO = ["All are welcome", "Traditional attire preferred", "Follow safety guidelines", "Avoid plastic", "Stay with Team volunteers", "Photos and videos will be shared"];

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [e, all, s] = await Promise.all([getEventById(id), getEvents(), getSettings()]);
  if (!e) notFound();
  const stops = [e.route_start, e.route_via, e.route_end].filter(Boolean) as string[];
  const maps = stops.length >= 2
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(stops[0] + " Gajwel")}&destination=${encodeURIComponent(stops[stops.length - 1] + " Gajwel")}${stops.length === 3 ? `&waypoints=${encodeURIComponent(stops[1] + " Gajwel")}` : ""}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((e.location ?? e.title) + " Gajwel")}`;
  const related = all.filter((x) => x.id !== e.id).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-r from-black via-burgundy-dark to-burgundy text-ivory">
        <div className="wrap relative py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-ivory/80"><Link href="/">Home</Link> › <Link href="/events">Events</Link> › <span>Event Details</span></nav>
          <span className="mt-4 inline-block rounded-full bg-burgundy px-3 py-1 text-xs ring-1 ring-gold/60">{new Date(e.starts_at) > new Date() ? "Upcoming Event" : "Past Event"}</span>
          <h1 className="mt-3 font-telugu text-4xl font-bold text-white md:text-6xl">{e.title_te || e.title}</h1>
          <p className="mt-1 font-display text-lg tracking-[0.25em] text-gold-light">{e.title.toUpperCase()}</p>
          <p className="mt-3 max-w-xl font-telugu text-ivory/90">{toText(s.motto_te)}</p>
          <p className="script-text absolute bottom-6 right-6 hidden -rotate-6 text-3xl text-white md:block">{s.hero_script}</p>
        </div>
      </section>

      <div className="wrap grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Cover src={e.cover_url} className="h-72 rounded-2xl" glyph="🔱" width={900} />
            <div>
              <div className="flex items-end gap-3 border-b border-gold/25 pb-3"><span className="font-display text-5xl font-bold text-burgundy">{dayNum(e.starts_at)}</span><span className="pb-1"><b>{monthShort(e.starts_at)} {new Date(e.starts_at).getFullYear()}</b><br /><span className="text-sm text-burgundy/70">{fmtWeekday(e.starts_at)}</span></span></div>
              <ul className="mt-3 space-y-3 text-sm">
                <li>🕖 {fmtTime(e.starts_at)} onwards</li>
                <li className="flex gap-1">📍<span>{stops.length ? <>
                  {e.route_start && <span className="block"><b>Start:</b> {e.route_start}</span>}
                  {e.route_via && <span className="block"><b>Via:</b> {e.route_via}</span>}
                  {e.route_end && <span className="block"><b>Destination:</b> {e.route_end}</span>}</> : e.location}</span></li>
                {e.organizer && <li>👥 Organized by <b>{e.organizer}</b></li>}
              </ul>
              <EventActions e={e} />
            </div>
          </div>

          <section>
            <h2 className="section-title underline-rule">About the Event</h2>
            <div className="mt-4 text-burgundy-dark/90">{(e.description_te || e.description) ? <RichText html={(e.description_te || e.description)!} /> : <p>Details will be shared soon.</p>}</div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {VALUES.map(([i, te, en]) => <div key={en} className="royal-card flex items-center gap-3 bg-blush p-3"><span aria-hidden className="text-2xl">{i}</span><span className="text-sm"><b className="font-telugu">{te}</b><br />{en}</span></div>)}
            </div>
          </section>

          {stops.length >= 2 && (
            <section>
              <div className="flex items-end justify-between"><h2 className="section-title underline-rule">Event Route</h2><a href={maps} target="_blank" rel="noreferrer" className="text-sm font-medium text-burgundy">View on Google Maps →</a></div>
              <ol className="royal-card mt-4 flex items-center justify-between gap-2 overflow-x-auto bg-[#F1EEEA] p-6">
                {stops.map((p, i) => (
                  <li key={p} className="flex flex-1 items-center gap-2">
                    <div className="text-center"><span aria-hidden className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-burgundy text-white">{i === 0 ? "S" : i === stops.length - 1 ? "D" : "•"}</span><span className="mt-2 block rounded bg-burgundy px-2 py-1 text-xs text-white">{p}<br />{i === 0 ? "(Start)" : i === stops.length - 1 ? "(Destination)" : "(Via)"}</span></div>
                    {i < stops.length - 1 && <span aria-hidden className="h-0 flex-1 border-t-2 border-dashed border-red-600" />}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {e.schedule?.length ? (
              <section className="royal-card p-5">
                <h2 className="section-title underline-rule">Event Schedule</h2>
                <ol className="mt-4 space-y-3 border-l-2 border-burgundy/30 pl-4 text-sm">
                  {e.schedule.map((r) => <li key={r.time + r.label} className="flex gap-3"><b className="w-16 shrink-0 text-burgundy">{r.time}</b><span>{r.label}</span></li>)}
                </ol>
              </section>
            ) : null}
            <section className="royal-card p-5">
              <h2 className="section-title underline-rule">Important Information</h2>
              <ul className="mt-4 divide-y divide-gold/20 text-sm">{(e.info?.length ? e.info : DEFAULT_INFO).map((t) => <li key={t} className="py-2.5">{t}</li>)}</ul>
            </section>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-b from-burgundy to-burgundy-dark p-6 text-center text-ivory ring-1 ring-gold/60">
            <div aria-hidden className="text-5xl">🔱</div><p className="script-text text-2xl">Jai</p><p className="font-display text-xl font-bold">DURGA BHAVANI</p><p className="mt-2 text-[10px] tracking-widest text-gold-light">FAITH • FESTIVAL • TOGETHERNESS</p>
          </div>
          <QuickLinks items={[{ href: "/events", label: "View on Calendar", icon: "🗓️" }, { href: maps, label: "View Route Map", icon: "🗺️" }, { href: "/gallery", label: "Photo Gallery", icon: "🖼️" }, { href: "/gallery", label: "Video Gallery", icon: "▶" }, { href: "/updates", label: "Join Team Mahathi", icon: "👥", signedOutOnly: true }]} />
          <div className="royal-card p-4">
            <div className="flex items-end justify-between"><h2 className="font-display text-lg font-bold text-burgundy">Related Events</h2><Link href="/events" className="text-sm text-burgundy">View all →</Link></div>
            <ul className="mt-3 space-y-3">{related.map((r) => (
              <li key={r.id}><Link href={`/events/${r.id}`} className="flex gap-3"><Cover src={r.cover_url} className="h-14 w-14 shrink-0 rounded-lg" width={150} /><span className="text-sm"><b className="block font-telugu text-burgundy">{r.title_te || r.title}</b>🗓️ {dayNum(r.starts_at)} {monthShort(r.starts_at)}<br />📍 {r.location}</span></Link></li>))}</ul>
          </div>
        </aside>
      </div>
    </>
  );
}
