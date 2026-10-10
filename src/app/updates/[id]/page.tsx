import Link from "next/link";
import { notFound } from "next/navigation";
import RichText from "@/components/RichText";
import Cover from "@/components/Cover";
import Engage from "@/components/Engage";
import Comments from "@/components/Comments";
import EventActions from "@/components/EventActions";
import PageHero from "@/components/PageHero";
import UpdateCard, { GROUPS, groupOf } from "@/components/UpdateCard";
import { fmtDate, fmtTime, fmtWeekday, getEventById, getMedia, getSettings, getUpdateById, getUpdates } from "@/lib/data";

export const revalidate = 30;

export default async function UpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [u, all, s, media] = await Promise.all([getUpdateById(id), getUpdates(), getSettings(), getMedia({ limit: 6 })]);
  if (!u) notFound();
  const event = u.event_id ? await getEventById(u.event_id) : null;
  const idx = all.findIndex((x) => x.id === u.id);
  const prev = all[idx + 1], next = all[idx - 1];
  const group = groupOf(u.kind);
  const groupLabel = GROUPS.find((g) => g.key === group)?.label ?? "Updates";
  const bodyHtml = u.body_te || u.body || "";
  const related = all.filter((x) => x.id !== u.id).slice(0, 2);

  return (
    <>
      <PageHero title="Updates" kicker="STAY CONNECTED • STAY INSPIRED" telugu={s.tagline_te} image={s.hero_image} />
      <div className="wrap">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
          <nav aria-label="Breadcrumb" className="text-burgundy"><Link href="/">⌂</Link> › <Link href="/updates">Updates</Link> › <Link href="/updates">{groupLabel}</Link> › <b className="font-telugu text-burgundy-dark">{u.title_te || u.title}</b></nav>
          <div className="flex gap-5 text-burgundy">{prev && <Link href={`/updates/${prev.id}`}>← Previous Update</Link>}{next && <Link href={`/updates/${next.id}`}>Next Update →</Link>}</div>
        </div>

        <div className="grid gap-6 pb-8 lg:grid-cols-[1fr_340px]">
          <article className="royal-card min-w-0 space-y-5 p-6">
            <div className="flex items-center gap-3 text-sm"><span className="rounded-full bg-burgundy px-3 py-1 text-white">{groupLabel.replace(/s$/, "")}</span><span className="text-burgundy/70">🗓️ {fmtDate(u.created_at)}</span></div>
            <h1 className="font-telugu text-3xl font-bold text-burgundy">{u.title_te || u.title}</h1>
            {event && <p className="text-sm text-burgundy/80">📍 {event.route_start ? `${event.route_start} → ${event.route_end ?? ""}` : event.location}</p>}
            <Cover src={u.cover_url} className="h-64 rounded-xl md:h-96" glyph="🔱" width={1100} />
            {bodyHtml && <RichText html={bodyHtml} />}
            {s.motto_te && <div className="rounded-xl bg-blush px-6 py-5 text-center font-semibold text-burgundy"><RichText html={s.motto_te} /></div>}
            <Engage id={u.id} views={u.views} likes={u.likes} comments={u.comments_count} title={u.title} />
            <Comments updateId={u.id} />
          </article>

          <aside className="space-y-5">
            {event && (
              <div className="royal-card p-5">
                <h2 className="font-display text-lg font-bold text-burgundy">Event Details</h2>
                <dl className="mt-3 grid grid-cols-[70px_1fr] gap-y-3 text-sm">
                  <dt className="text-burgundy/70">Date</dt><dd>{fmtDate(event.starts_at)} ({fmtWeekday(event.starts_at)})</dd>
                  <dt className="text-burgundy/70">Time</dt><dd>{fmtTime(event.starts_at)} onwards</dd>
                  <dt className="text-burgundy/70">Route</dt><dd>{event.route_start ? <>
                    <b>Start:</b> {event.route_start}<br />{event.route_via && <><b>Via:</b> {event.route_via}<br /></>}<b>Destination:</b> {event.route_end}</> : event.location}</dd>
                </dl>
                <EventActions e={event} />
                <Link href={`/events/${event.id}`} className="mt-3 block text-center text-sm font-medium text-burgundy">Open event page →</Link>
              </div>
            )}
            {media.length > 0 && (
              <div className="royal-card p-5">
                <div className="flex items-end justify-between"><h2 className="font-display text-lg font-bold text-burgundy">Gallery</h2><Link href="/gallery" className="text-sm text-burgundy">View All →</Link></div>
                <div className="mt-3 grid grid-cols-3 gap-2">{media.slice(0, 6).map((m) => <Cover key={m.id} src={m.type === "photo" ? m.url : null} glyph="▶" className="aspect-[4/3] rounded-md" width={200} />)}</div>
              </div>
            )}
            <div className="royal-card p-5">
              <div className="flex items-end justify-between"><h2 className="font-display text-lg font-bold text-burgundy">Related Updates</h2><Link href="/updates" className="text-sm text-burgundy">View All →</Link></div>
              <div className="mt-3 space-y-3">{related.map((r) => <UpdateCard key={r.id} u={r} list />)}</div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
