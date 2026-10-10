import Link from "next/link";
import { notFound } from "next/navigation";
import RichText from "@/components/RichText";
import Cover from "@/components/Cover";
import Engage from "@/components/Engage";
import Comments from "@/components/Comments";
import EventActions from "@/components/EventActions";
import PageHero from "@/components/PageHero";
import UpdateCard from "@/components/UpdateCard";
import { GROUPS, TAG, groupOf } from "@/lib/updates-meta";
import { getT } from "@/lib/i18n/server";
import { eventRoute, eventLocation, eventWhere, localSettings, updateBody, updateTitle } from "@/lib/i18n/content";
import { fmtDate, fmtTime, fmtWeekday, getEventById, getMedia, getSettings, getUpdateById, getUpdates } from "@/lib/data";

export default async function UpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, lang } = await getT();
  const [u, all, s, media] = await Promise.all([getUpdateById(id), getUpdates(), getSettings(), getMedia({ limit: 6 })]);
  if (!u) notFound();
  const event = u.event_id ? await getEventById(u.event_id) : null;
  const idx = all.findIndex((x) => x.id === u.id);
  const prev = all[idx + 1], next = all[idx - 1];
  const L = localSettings(s, lang);
  const group = groupOf(u.kind);
  const groupLabel = t(GROUPS.find((g) => g.key === group)?.labelKey ?? "updates.title");
  const title = updateTitle(u, lang);
  const bodyHtml = updateBody(u, lang);
  const route = event ? eventRoute(event, lang) : null;
  const related = all.filter((x) => x.id !== u.id).slice(0, 2);

  return (
    <>
      <PageHero title={t("updates.title")} kicker={t("hero.updates.kicker")} sub={L.headline} image={s.hero_image} />
      <div className="wrap">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
          <nav aria-label={t("updates.breadcrumb")} className="text-burgundy"><Link href="/">⌂</Link> › <Link href="/updates">{t("updates.title")}</Link> › <Link href="/updates">{groupLabel}</Link> › <b className="font-telugu text-burgundy-dark">{title}</b></nav>
          <div className="flex gap-5 text-burgundy">{prev && <Link href={`/updates/${prev.id}`}>{t("updates.prev")}</Link>}{next && <Link href={`/updates/${next.id}`}>{t("updates.next")}</Link>}</div>
        </div>

        <div className="grid gap-6 pb-8 lg:grid-cols-[1fr_340px]">
          <article className="royal-card min-w-0 space-y-5 p-6">
            <div className="flex items-center gap-3 text-sm"><span className="rounded-full bg-burgundy px-3 py-1 text-white">{t(TAG[group].labelKey)}</span><span className="text-burgundy/70">🗓️ {fmtDate(u.created_at, lang)}</span></div>
            <h1 className="font-telugu text-3xl font-bold text-burgundy">{title}</h1>
            {event && <p className="text-sm text-burgundy/80">📍 {eventWhere(event, lang)}</p>}
            <Cover src={u.cover_url} className="h-64 rounded-xl md:h-96" glyph="🔱" width={1100} />
            {bodyHtml && <RichText html={bodyHtml} />}
            {L.motto && <div className="rounded-xl bg-blush px-6 py-5 text-center font-semibold text-burgundy"><RichText html={L.motto} /></div>}
            <Engage id={u.id} views={u.views} likes={u.likes} comments={u.comments_count} title={title} />
            <Comments updateId={u.id} />
          </article>

          <aside className="space-y-5">
            {event && (
              <div className="royal-card p-5">
                <h2 className="font-display text-lg font-bold text-burgundy">{t("updates.eventDetails")}</h2>
                <dl className="mt-3 grid grid-cols-[70px_1fr] gap-y-3 text-sm">
                  <dt className="text-burgundy/70">{t("updates.date")}</dt><dd>{fmtDate(event.starts_at, lang)} ({fmtWeekday(event.starts_at, lang)})</dd>
                  <dt className="text-burgundy/70">{t("updates.time")}</dt><dd>{t("events.onwards", { time: fmtTime(event.starts_at, lang) })}</dd>
                  <dt className="text-burgundy/70">{t("updates.route")}</dt><dd>{route?.start ? <>
                    <b>{t("events.start")}</b> {route.start}<br />{route.via && <><b>{t("events.via")}</b> {route.via}<br /></>}<b>{t("events.destination")}</b> {route.end}</> : eventLocation(event, lang)}</dd>
                </dl>
                <EventActions e={event} />
                <Link href={`/events/${event.id}`} className="mt-3 block text-center text-sm font-medium text-burgundy">{t("updates.openEvent")}</Link>
              </div>
            )}
            {media.length > 0 && (
              <div className="royal-card p-5">
                <div className="flex items-end justify-between"><h2 className="font-display text-lg font-bold text-burgundy">{t("gallery.title")}</h2><Link href="/gallery" className="text-sm text-burgundy">{t("updates.viewAllCap")}</Link></div>
                <div className="mt-3 grid grid-cols-3 gap-2">{media.slice(0, 6).map((m) => <Cover key={m.id} src={m.type === "photo" ? m.url : null} glyph="▶" className="aspect-[4/3] rounded-md" width={200} />)}</div>
              </div>
            )}
            <div className="royal-card p-5">
              <div className="flex items-end justify-between"><h2 className="font-display text-lg font-bold text-burgundy">{t("updates.related")}</h2><Link href="/updates" className="text-sm text-burgundy">{t("updates.viewAllCap")}</Link></div>
              <div className="mt-3 space-y-3">{related.map((r) => <UpdateCard key={r.id} u={r} list />)}</div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
