import Link from "next/link";
import { notFound } from "next/navigation";
import RichText from "@/components/RichText";
import { toText } from "@/lib/rich";
import Cover from "@/components/Cover";
import EventActions from "@/components/EventActions";
import { QuickLinks } from "@/components/EventsExplorer";
import { dayNum, fmtTime, fmtWeekday, getEventById, getEvents, getSettings, monthShort } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { eventAltTitle, eventDescription, eventInfo, eventLocation, eventOrganizer, eventRoute, eventSchedule, eventTitle, localSettings } from "@/lib/i18n/content";

const VALUES = [["🙏", "events.value1"], ["👥", "events.value2"], ["🤝", "events.value3"], ["🪷", "events.value4"]] as const;

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, lang } = await getT();
  const [e, all, s] = await Promise.all([getEventById(id), getEvents(), getSettings()]);
  if (!e) notFound();
  const L = localSettings(s, lang);
  const title = eventTitle(e, lang);
  const alt = eventAltTitle(e, lang);
  const r = eventRoute(e, lang);
  const desc = eventDescription(e, lang);
  const loc = eventLocation(e, lang);
  const organizer = eventOrganizer(e, lang);
  const schedule = eventSchedule(e, lang);
  const info = eventInfo(e, lang);
  const stops = [r.start, r.via, r.end].filter(Boolean) as string[];
  // Map searches use the English names (Google Maps resolves them best); fall back to whatever is set.
  const mapStops = [e.route_start || r.start, e.route_via || r.via, e.route_end || r.end].filter(Boolean) as string[];
  const maps = stops.length >= 2
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(mapStops[0] + " Gajwel")}&destination=${encodeURIComponent(mapStops[mapStops.length - 1] + " Gajwel")}${mapStops.length === 3 ? `&waypoints=${encodeURIComponent(mapStops[1] + " Gajwel")}` : ""}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((e.location ?? e.title) + " Gajwel")}`;
  const related = all.filter((x) => x.id !== e.id).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-r from-black via-burgundy-dark to-burgundy text-ivory">
        <div className="wrap relative py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-ivory/80"><Link href="/">{t("events.home")}</Link> › <Link href="/events">{t("events.title")}</Link> › <span>{t("events.detailsCrumb")}</span></nav>
          <span className="mt-4 inline-block rounded-full bg-burgundy px-3 py-1 text-xs ring-1 ring-gold/60">{new Date(e.starts_at) > new Date() ? t("events.upcomingBadge") : t("events.pastBadge")}</span>
          <h1 className="mt-3 font-telugu text-4xl font-bold text-white md:text-6xl">{title}</h1> 
          <p className="mt-3 max-w-xl font-telugu text-ivory/90">{toText(L.motto)}</p> 
        </div>
      </section>

      <div className="wrap grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Cover src={e.cover_url} className="h-72 rounded-2xl" glyph="🔱" width={900} />
            <div>
              <div className="flex items-end gap-3 border-b border-gold/25 pb-3"><span className="font-display text-5xl font-bold text-burgundy">{dayNum(e.starts_at)}</span><span className="pb-1"><b>{monthShort(e.starts_at, lang)} {new Date(e.starts_at).getFullYear()}</b><br /><span className="text-sm text-burgundy/70">{fmtWeekday(e.starts_at, lang)}</span></span></div>
              <ul className="mt-3 space-y-3 text-sm">
                <li>🕖 {t("events.onwards", { time: fmtTime(e.starts_at, lang) })}</li>
                <li className="flex gap-1">📍<span>{stops.length ? <>
                  {r.start && <span className="block"><b>{t("events.start")}</b> {r.start}</span>}
                  {r.via && <span className="block"><b>{t("events.via")}</b> {r.via}</span>}
                  {r.end && <span className="block"><b>{t("events.destination")}</b> {r.end}</span>}</> : loc}</span></li>
                {organizer && <li>👥 {t("events.organizedBy")} <b>{organizer}</b></li>}
              </ul>
              <EventActions e={e} />
            </div>
          </div>

          <section>
            <h2 className="section-title underline-rule">{t("events.about")}</h2>
            <div className="mt-4 text-burgundy-dark/90">{desc ? <RichText html={desc} /> : <p>{t("events.soon")}</p>}</div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {VALUES.map(([i, k]) => <div key={k} className="royal-card flex items-center gap-3 bg-blush p-3"><span aria-hidden className="text-2xl">{i}</span><span className="text-sm font-semibold">{t(k)}</span></div>)}
            </div>
          </section>

          {stops.length >= 2 && (
            <section>
              <div className="flex items-end justify-between"><h2 className="section-title underline-rule">{t("events.route")}</h2><a href={maps} target="_blank" rel="noreferrer" className="text-sm font-medium text-burgundy">{t("events.viewMaps")}</a></div>
              <ol className="royal-card mt-4 flex items-center justify-between gap-2 overflow-x-auto bg-[#F1EEEA] p-6">
                {stops.map((p, i) => (
                  <li key={p} className="flex flex-1 items-center gap-2">
                    <div className="text-center"><span aria-hidden className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-burgundy text-white">{i === 0 ? "S" : i === stops.length - 1 ? "D" : "•"}</span><span className="mt-2 block rounded bg-burgundy px-2 py-1 text-xs text-white">{p}<br />{i === 0 ? t("events.startTag") : i === stops.length - 1 ? t("events.destTag") : t("events.viaTag")}</span></div>
                    {i < stops.length - 1 && <span aria-hidden className="h-0 flex-1 border-t-2 border-dashed border-red-600" />}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {schedule.length ? (
              <section className="royal-card p-5">
                <h2 className="section-title underline-rule">{t("events.schedule")}</h2>
                <ol className="mt-4 space-y-3 border-l-2 border-burgundy/30 pl-4 text-sm">
                  {schedule.map((row) => <li key={row.time + row.label} className="flex gap-3"><b className="w-16 shrink-0 text-burgundy">{row.time}</b><span>{row.label}</span></li>)}
                </ol>
              </section>
            ) : null}
            <section className="royal-card p-5">
              <h2 className="section-title underline-rule">{t("events.info")}</h2>
              <ul className="mt-4 divide-y divide-gold/20 text-sm">{(info.length ? info : t("events.defaultInfo").split("|")).map((line) => <li key={line} className="py-2.5">{line}</li>)}</ul>
            </section>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-b from-burgundy to-burgundy-dark p-6 text-center text-ivory ring-1 ring-gold/60">
            <div aria-hidden className="text-5xl">🔱</div><p className="script-text text-2xl">{t("events.jai")}</p><p className="font-display text-xl font-bold">{t("events.bhavani")}</p><p className="mt-2 text-[10px] tracking-widest text-gold-light">{t("events.motto")}</p>
          </div>
          <QuickLinks items={[{ href: "/events", label: "quick.viewOnCalendar", icon: "🗓️" }, { href: maps, label: "quick.routeMap", icon: "🗺️" }, { href: "/gallery", label: "quick.photos", icon: "🖼️" }, { href: "/gallery", label: "quick.videos", icon: "▶" }, { href: "/signup", label: "quick.joinTeam", icon: "👥", signedOutOnly: true }]} />
          <div className="royal-card p-4">
            <div className="flex items-end justify-between"><h2 className="font-display text-lg font-bold text-burgundy">{t("events.related")}</h2><Link href="/events" className="text-sm text-burgundy">{t("updates.viewAll")}</Link></div>
            <ul className="mt-3 space-y-3">{related.map((x) => (
              <li key={x.id}><Link href={`/events/${x.id}`} className="flex gap-3"><Cover src={x.cover_url} className="h-14 w-14 shrink-0 rounded-lg" width={150} /><span className="text-sm"><b className="block font-telugu text-burgundy">{eventTitle(x, lang)}</b>🗓️ {dayNum(x.starts_at)} {monthShort(x.starts_at, lang)}<br />📍 {eventLocation(x, lang)}</span></Link></li>))}</ul>
          </div>
        </aside>
      </div>
    </>
  );
}
